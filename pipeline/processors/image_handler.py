"""
Image handler: Manages photo URL extraction, concurrent Wikimedia Commons geosearch enrichment,
and download for public-domain/agency images.
"""

import logging
import hashlib
import time
from pathlib import Path
from typing import List, Dict, Any, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed

import httpx

from pipeline.config.settings import IMAGES_DIR

logger = logging.getLogger(__name__)

SAFE_DOMAINS = [
    "recreation.gov",
    "ridb.recreation.gov",
    "usda.gov",
    "fs.usda.gov",
    "blm.gov",
    "nps.gov",
    "doi.gov",
    "fws.gov",
    "usace.army.mil",
    "wikimedia.org",
    "wikimedia.org/wikipedia/commons",
    "upload.wikimedia.org",
]

COMMONS_API_URL = "https://commons.wikimedia.org/w/api.php"


def fetch_wikimedia_commons_photos(
    lat: float, lon: float, radius_meters: int = 3500, max_images: int = 3
) -> List[Dict[str, Any]]:
    """
    Search Wikimedia Commons for public domain/Creative Commons photos near coordinates.
    """
    params = {
        'action': 'query',
        'generator': 'geosearch',
        'ggscoord': f'{lat}|{lon}',
        'ggsradius': str(radius_meters),
        'ggsnamespace': '6',  # File namespace
        'prop': 'imageinfo',
        'iiprop': 'url|size|mime|extmetadata',
        'format': 'json',
    }
    headers = {
        'User-Agent': 'CampRooFreeCampingPipeline/1.0 (contact@camproo.com)'
    }
    
    try:
        with httpx.Client(timeout=10.0, headers=headers) as client:
            resp = client.get(COMMONS_API_URL, params=params)
            resp.raise_for_status()
            data = resp.json()
            
            pages = data.get('query', {}).get('pages', {})
            photos = []
            
            for pid, page in pages.items():
                title = page.get('title', '').replace('File:', '')
                imageinfo = page.get('imageinfo', [])
                if not imageinfo:
                    continue
                info = imageinfo[0]
                url = info.get('url')
                mime = info.get('mime', '').lower()
                
                if url and any(ext in mime for ext in ['jpeg', 'jpg', 'png', 'webp']):
                    meta = info.get('extmetadata', {})
                    license_name = meta.get('LicenseShortName', {}).get('value', 'CC/Public Domain')
                    artist = meta.get('Artist', {}).get('value', 'Wikimedia Commons')
                    
                    photos.append({
                        'url': url,
                        'title': title,
                        'source': 'wikimedia_commons',
                        'attribution': f"Wikimedia Commons ({license_name}) - {str(artist)[:50]}",
                        'is_public_domain': True,
                    })
                    
                    if len(photos) >= max_images:
                        break
                        
            return photos
    except Exception as e:
        logger.debug(f"Wikimedia geosearch failed for {lat},{lon}: {e}")
        return []


def download_agency_image(url: str, spot_id: str, index: int = 0) -> Optional[str]:
    """
    Download a public-domain agency or Wikimedia image to local storage.
    """
    from urllib.parse import urlparse
    parsed = urlparse(url)
    domain = parsed.hostname or ""
    is_safe = any(domain.endswith(safe) for safe in SAFE_DOMAINS)

    if not is_safe:
        return None

    spot_dir = Path(IMAGES_DIR) / spot_id
    spot_dir.mkdir(parents=True, exist_ok=True)

    path = parsed.path.lower()
    if path.endswith(".png"):
        ext = ".png"
    elif path.endswith(".webp"):
        ext = ".webp"
    else:
        ext = ".jpg"

    filename = f"photo_{index}{ext}"
    filepath = spot_dir / filename

    if filepath.exists() and filepath.stat().st_size > 1000:
        return str(filepath)

    try:
        # Follow redirects and set user agent
        with httpx.Client(timeout=25.0, follow_redirects=True) as client:
            response = client.get(url, headers={'User-Agent': 'CampRooBot/1.0 (contact@camproo.com)'})
            response.raise_for_status()

            content_type = response.headers.get("content-type", "")
            if "image" not in content_type and "octet-stream" not in content_type:
                return None

            filepath.write_bytes(response.content)
            return str(filepath)

    except Exception as e:
        logger.debug(f"Failed to download image {url}: {e}")
        return None


def process_images(
    spots: list,
    download_agency: bool = False,
    enrich_wikimedia: bool = True,
    max_wikimedia_lookups: int = 350,
) -> list:
    """
    Process image URLs for all spots:
    1. Enrich spots with Wikimedia Commons photos via concurrent worker pool.
    2. If download_agency is True, download images locally to data/images/{id}/.
    """
    logger.info(f"Processing images across {len(spots)} spots (enrich_wikimedia={enrich_wikimedia}, download={download_agency})")
    
    enriched_count = 0
    downloaded_count = 0
    spots_with_photos = 0
    total_photos = 0
    
    if enrich_wikimedia:
        # Enrich candidate spots without photos
        candidate_spots = [s for s in spots if not s.photo_urls][:max_wikimedia_lookups]
        logger.info(f"Concurrently querying Wikimedia Commons for {len(candidate_spots)} spots...")
        
        def _lookup(spot):
            return spot, fetch_wikimedia_commons_photos(spot.lat, spot.lon, radius_meters=3500)
            
        with ThreadPoolExecutor(max_workers=8) as executor:
            future_to_spot = {executor.submit(_lookup, s): s for s in candidate_spots}
            for future in as_completed(future_to_spot):
                try:
                    spot, photos = future.result()
                    if photos:
                        spot.photo_urls.extend(photos)
                        enriched_count += 1
                except Exception as e:
                    pass
                    
        logger.info(f"Wikimedia Commons enrichment completed: {enriched_count} spots found photos")

    # If download is requested, download photos concurrently
    if download_agency:
        download_tasks = []
        for spot in spots:
            for i, photo in enumerate(spot.photo_urls):
                url = photo.get("url", "")
                if url and photo.get("is_public_domain", False):
                    download_tasks.append((url, spot.id, i, photo))

        logger.info(f"Downloading {len(download_tasks)} photos concurrently to {IMAGES_DIR}...")
        
        def _download_task(task):
            url, spot_id, i, photo_dict = task
            local_path = download_agency_image(url, spot_id, i)
            if local_path:
                photo_dict["local_path"] = local_path
                return 1
            return 0

        with ThreadPoolExecutor(max_workers=6) as executor:
            futures = [executor.submit(_download_task, t) for t in download_tasks]
            for f in as_completed(futures):
                try:
                    downloaded_count += f.result()
                except Exception:
                    pass

    for spot in spots:
        if spot.photo_urls:
            spots_with_photos += 1
            total_photos += len(spot.photo_urls)

    coverage_pct = (spots_with_photos / len(spots) * 100) if spots else 0
    logger.info(
        f"Image processing complete: {total_photos} total photos across {spots_with_photos} spots "
        f"({coverage_pct:.1f}% coverage). Enriched via Commons: {enriched_count}, Downloaded: {downloaded_count}"
    )

    return spots
