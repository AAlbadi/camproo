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

# Authentic public land and dispersed camping photography from USFS/BLM and Wikimedia Commons
ENVIRONMENT_FALLBACK_PHOTOS = {
    "desert": [
        "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/67/-TravelTuesday_with_My_Public_Lands_%2824446462030%29.jpg/1280px--TravelTuesday_with_My_Public_Lands_%2824446462030%29.jpg",
        "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/99/-TravelTuesday_with_My_Public_Lands_at_Canyon_Rims_Recreation_Area_SRMA_%2824115137893%29.jpg/1280px--TravelTuesday_with_My_Public_Lands_at_Canyon_Rims_Recreation_Area_SRMA_%2824115137893%29.jpg",
        "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ef/Rock_formations_along_Geology_Tour_Road_at_sunset_%2851146471142%29.jpg/1280px-Rock_formations_along_Geology_Tour_Road_at_sunset_%2851146471142%29.jpg",
    ],
    "forest": [
        "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7d/Manti-La_Sal_National_Forest_%2827006934032%29.jpg/1280px-Manti-La_Sal_National_Forest_%2827006934032%29.jpg",
        "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5e/Trailer_Camping_ET5A7516_%2829804296456%29.jpg/1920px-Trailer_Camping_ET5A7516_%2829804296456%29.jpg",
        "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/46/Blesner_Creek_Autumn_Sunset_-_Fall_Colors_at_Superior_National_Forest%2C_Minnesota_%2836763922793%29.jpg/1280px-Blesner_Creek_Autumn_Sunset_-_Fall_Colors_at_Superior_National_Forest%2C_Minnesota_%2836763922793%29.jpg",
    ],
    "mountain": [
        "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/16/Sedona_Red_Rocks_from_I-17.jpg/1280px-Sedona_Red_Rocks_from_I-17.jpg",
        "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3b/Zephyr_Cove%2C_Lake_Tahoe%2C_NV_8-10_%2816347314744%29.jpg/1280px-Zephyr_Cove%2C_Lake_Tahoe%2C_NV_8-10_%2816347314744%29.jpg",
        "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/08/View_of_fields%2C_mountains_and_mist_in_Cades_Cove_looking_SW._-_Great_Smoky_Mountains_National_Park_Roads_and_Bridges%2C_Cades_Cove_Road_and_Laurel_Creek_Road%2C_From_Townsend_Wye_HAER_TENN%2C78-GAT.V%2C6D-18.tif/lossy-page1-1280px-thumbnail.tif.jpg",
    ],
    "coastal": [
        "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d4/Acadia_National_Park%2C_Maine_%288cd03391-75a7-403f-8d64-42aa07408dfb%29.jpg/1280px-Acadia_National_Park%2C_Maine_%288cd03391-75a7-403f-8d64-42aa07408dfb%29.jpg",
        "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e9/Acadia_National_Park%2C_Maine_%28a84afa37-b94d-49d1-9be8-bb2d45115784%29.jpg/1280px-Acadia_National_Park%2C_Maine_%28a84afa37-b94d-49d1-9be8-bb2d45115784%29.jpg",
        "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/20/Acadia_National_Park%2C_Maine_%285e76e4c7-b65c-4cd0-9a0b-9d0082e50fa8%29.jpg/1280px-Acadia_National_Park%2C_Maine_%285e76e4c7-b65c-4cd0-9a0b-9d0082e50fa8%29.jpg",
    ],
    "rural": [
        "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/95/Hill_Country_State_Natural_Area.jpg/1280px-Hill_Country_State_Natural_Area.jpg",
        "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ef/Overlook_View_Hill_Country_SNA_Texas_2023.jpg/1280px-Overlook_View_Hill_Country_SNA_Texas_2023.jpg",
        "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/33/Hill_Country_SNA_Texas_2023.jpg/1280px-Hill_Country_SNA_Texas_2023.jpg",
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
