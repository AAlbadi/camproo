"""
CampRoo Converter: Transforms CampSpot records into the CampRoo app's
Spot TypeScript interface format for direct use in the frontend.
Guarantees high-resolution natural landscape photos for every single spot.
"""

import json
import hashlib
import logging
import re
from pathlib import Path

from pipeline.config.settings import EXPORTS_DIR
from pipeline.processors.normalizer import CampSpot

logger = logging.getLogger(__name__)

# High-quality natural outdoor camping and dispersed landscape imagery from Unsplash
ENVIRONMENT_FALLBACK_PHOTOS = {
    "desert": [
        "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80",  # Desert BLM vista
        "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80",  # Desert road trip
        "https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=80",  # Joshua tree / red rock
        "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",  # Arid plains sunset
    ],
    "forest": [
        "https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=1200&q=80",  # Deep pine forest
        "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=80",  # Forest lake campsite
        "https://images.unsplash.com/photo-1516214104703-d870798883c5?auto=format&fit=crop&w=1200&q=80",  # Misty forest road
        "https://images.unsplash.com/photo-1470246973918-29a93221c455?auto=format&fit=crop&w=1200&q=80",  # Pine trees sunrise
    ],
    "mountain": [
        "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80",  # Alpine peak
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",  # Mountain valley & river
        "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80",  # Mountain wilderness
        "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1200&q=80",  # Mountain overlook
    ],
    "coastal": [
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",  # Pacific coastline
        "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=80",  # Shoreline waters
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",  # River inlet
    ],
    "rural": [
        "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",  # Open grassland
        "https://images.unsplash.com/photo-1470246973918-29a93221c455?auto=format&fit=crop&w=1200&q=80",  # Golden hour prairie
        "https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=80",  # Wide horizon
    ],
}

MANAGER_TO_SPACE_ENV = {
    "BLM": ("desert_oasis", "desert"),
    "USFS": ("forest_clearing", "forest"),
    "NPS": ("acreage", "mountain"),
    "USACE": ("acreage", "coastal"),
    "FWS": ("acreage", "rural"),
    "BOR": ("acreage", "rural"),
    "State": ("acreage", "forest"),
    "Unknown": ("acreage", "rural"),
}

WESTERN_DESERT_STATES = {"AZ", "NM", "NV", "UT"}
COASTAL_STATES = {"CA", "OR", "WA", "ME", "MA", "CT", "RI", "NH", "FL", "SC", "NC", "VA", "MD", "DE", "NJ", "NY", "TX", "LA", "MS", "AL", "HI", "AK"}
MOUNTAIN_STATES = {"CO", "MT", "WY", "ID", "UT"}


def _make_slug(name: str, spot_id: str) -> str:
    slug = re.sub(r'[^a-z0-9]+', '-', name.lower().strip()).strip('-')[:40]
    hash_suffix = hashlib.md5(spot_id.encode()).hexdigest()[:6]
    return f"spot-{slug}-{hash_suffix}" if slug else f"spot-{hash_suffix}"


def _guess_environment(spot: CampSpot) -> str:
    state = spot.state.upper()
    desc_lower = (spot.description or "").lower()
    name_lower = spot.name.lower()

    if any(w in desc_lower or w in name_lower for w in ["desert", "canyon", "mesa", "arid", "yucca", "sagebrush"]):
        return "desert"
    if any(w in desc_lower or w in name_lower for w in ["ocean", "beach", "coast", "shore", "lake", "reservoir"]):
        return "coastal"
    if any(w in desc_lower or w in name_lower for w in ["mountain", "alpine", "peak", "summit", "ridge", "elevation"]):
        return "mountain"
    if any(w in desc_lower or w in name_lower for w in ["forest", "pine", "spruce", "cedar", "timber", "woodland"]):
        return "forest"
    if any(w in desc_lower or w in name_lower for w in ["farm", "ranch", "meadow", "prairie", "grassland"]):
        return "rural"

    if state in WESTERN_DESERT_STATES:
        return "desert"
    if state in MOUNTAIN_STATES:
        return "mountain"

    _, env = MANAGER_TO_SPACE_ENV.get(spot.land_manager, ("acreage", "rural"))
    return env


def _map_amenities(spot: CampSpot) -> dict:
    amenities = set(spot.amenities)
    return {
        "electricity": "none",
        "water": "potable_hookup" if "drinking_water" in amenities else "none",
        "sewer": "none",
        "wifi": "wifi" in amenities,
        "bathroom": "toilets" in amenities,
        "shower": "shower" in amenities,
        "firePit": "fire_pit" in amenities,
        "trash": "trash" in amenities,
        "shade": "partial",
        "generatorsAllowed": True,
        "petsAllowed": True,
        "familyFriendly": True,
        "quietSetting": True,
        "offGridCapable": True,
    }


def convert_to_camproo(spot: CampSpot) -> dict:
    """Convert a single CampSpot to CampRoo Spot format with guaranteed high-quality photography."""
    env = _guess_environment(spot)
    space_type = MANAGER_TO_SPACE_ENV.get(spot.land_manager, ("acreage",))[0]

    # Gather any real agency or Wikimedia photos
    photos = []
    for p in spot.photo_urls:
        url = p.get("local_path") or p.get("url", "")
        if url:
            photos.append(url)

    # If spot has no photos or fewer than 2, enrich deterministically from natural photography presets
    if len(photos) < 2:
        defaults = ENVIRONMENT_FALLBACK_PHOTOS.get(env, ENVIRONMENT_FALLBACK_PHOTOS["forest"])
        # Deterministically select photo using hash of spot id
        seed = int(hashlib.md5(spot.id.encode()).hexdigest(), 16)
        p1 = defaults[seed % len(defaults)]
        p2 = defaults[(seed + 1) % len(defaults)]
        p3 = defaults[(seed + 2) % len(defaults)]
        for cand in [p1, p2, p3]:
            if cand not in photos:
                photos.append(cand)

    return {
        "id": _make_slug(spot.name, spot.id),
        "hostId": "pipeline-import",
        "title": spot.name,
        "tagline": f"Free {spot.land_manager} camping — {spot.state}" if spot.land_manager != "Unknown" else f"Free camping — {spot.state}",
        "description": spot.description or f"Free camping spot managed by {spot.land_manager}. {spot.access_notes}".strip(),
        "locationName": spot.name,
        "generalArea": f"{spot.state}, USA",
        "coordinates": [spot.lat, spot.lon],
        "photos": photos,
        "spaceType": space_type,
        "environment": env,
        "rigCompatibility": {
            "maxLengthFt": 30,
            "maxHeightFt": 13.0,
            "maxWidthFt": 8.5,
            "acceptedTypes": ["class_b", "campervan", "truck_camper", "rooftop_tent"],
            "accessType": "back_in",
            "surfaceType": "dirt",
            "isLevel": False,
            "turnaroundSpace": "Varies — check access notes",
            "trailerDisconnectRequired": False,
        },
        "amenities": _map_amenities(spot),
        "proximity": {
            "fuelNearbyMiles": 0,
            "groceriesNearbyMiles": 0,
            "rvDumpNearbyMiles": 0,
            "attractionNote": spot.access_notes or "",
        },
        "rules": {
            "maxStayNights": _parse_stay_limit(spot.stay_limit),
            "checkInWindow": "Anytime",
            "checkOutTime": "Anytime",
            "quietHours": "Respect other campers",
            "campfirePolicy": "Check local fire restrictions",
            "childrenAllowed": True,
            "extraGuestsAllowed": True,
            "hostInteraction": "independent_gate_code",
        },
        "gatekeeping": "any_member",
        "rating": 0,
        "reviewCount": 0,
        "isFree": True,
        "isFeatured": False,
        "status": "active",
        "createdAt": spot.scraped_at[:10] if spot.scraped_at else "",
        "_pipeline": {
            "source": spot.source,
            "source_url": spot.source_url,
            "land_manager": spot.land_manager,
            "original_id": spot.id,
            "amenities_raw": spot.amenities,
            "photo_attribution": [p.get("attribution", "") for p in spot.photo_urls if p.get("attribution")],
        },
    }


def _parse_stay_limit(stay_limit: str | None) -> int:
    if not stay_limit:
        return 14
    match = re.search(r'(\d+)', stay_limit)
    return int(match.group(1)) if match else 14


def export_camproo_json(
    spots: list[CampSpot],
    output_dir: str | None = None,
    filename: str = "camproo_spots.json",
) -> str:
    out_dir = Path(output_dir or EXPORTS_DIR)
    out_dir.mkdir(parents=True, exist_ok=True)
    filepath = out_dir / filename

    camproo_spots = []
    for spot in spots:
        try:
            converted = convert_to_camproo(spot)
            camproo_spots.append(converted)
        except Exception as e:
            logger.warning(f"Failed to convert spot {spot.id}: {e}")

    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(camproo_spots, f, indent=2)

    logger.info(f"Exported CampRoo JSON: {filepath} ({len(camproo_spots)} spots with photos)")
    return str(filepath)
