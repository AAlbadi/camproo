"""
Normalizer: Maps raw collector output from all sources to a unified CampSpot schema.
"""

import logging
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from typing import Any

logger = logging.getLogger(__name__)

AMENITY_KEYWORDS = {
    "drinking_water": ["drinking_water", "water", "potable", "WATER_YN"],
    "toilets": ["toilets", "toilet", "restroom", "vault", "pit", "TOILET_YN"],
    "fire_pit": ["fire_pit", "firepit", "fire pit", "openfire", "campfire", "fire ring"],
    "picnic_table": ["picnic_table", "picnic table", "table"],
    "electricity": ["electricity", "electric", "power"],
    "shower": ["shower"],
    "trash": ["trash", "waste_disposal", "garbage", "TRASH_YN"],
    "wifi": ["wifi", "internet_access", "internet", "wlan"],
}

LAND_MANAGER_MAP = {
    # RIDB OrgIDs
    "131": "USFS",
    "126": "BLM",
    "128": "NPS",
    "129": "USACE",
    "127": "FWS",
    "130": "TVA",
    # OSM operator strings (lowercased for matching)
    "usfs": "USFS",
    "us forest service": "USFS",
    "usda forest service": "USFS",
    "united states forest service": "USFS",
    "forest service": "USFS",
    "blm": "BLM",
    "bureau of land management": "BLM",
    "nps": "NPS",
    "national park service": "NPS",
    "usace": "USACE",
    "army corps": "USACE",
    "us army corps of engineers": "USACE",
    "usfws": "FWS",
    "us fish and wildlife service": "FWS",
    "fish and wildlife service": "FWS",
    "bureau of reclamation": "BOR",
    "bor": "BOR",
}


@dataclass
class PhotoInfo:
    """Metadata for a campsite photo."""
    url: str
    source: str  # "ridb", "osm", "blm", "usfs", "freecampsites"
    attribution: str = ""
    is_public_domain: bool = False
    title: str = ""
    local_path: str = ""


@dataclass
class CampSpot:
    """Unified schema for a free camping spot from any data source."""
    id: str
    name: str
    lat: float
    lon: float
    description: str = ""
    amenities: list[str] = field(default_factory=list)
    access_notes: str = ""
    land_manager: str = "Unknown"
    is_free: bool = True
    stay_limit: str | None = None
    photo_urls: list[dict] = field(default_factory=list)
    source_url: str = ""
    source: str = ""
    scraped_at: str = ""
    state: str = ""
    raw_data: dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        """Convert to a plain dict for JSON serialization."""
        return asdict(self)


def resolve_land_manager(raw_value: str | None) -> str:
    """Resolve a raw land manager string/ID to a canonical name."""
    if not raw_value:
        return "Unknown"
    raw_lower = raw_value.strip().lower()
    # Direct lookup
    if raw_lower in LAND_MANAGER_MAP:
        return LAND_MANAGER_MAP[raw_lower]
    # Substring matching
    for key, canonical in LAND_MANAGER_MAP.items():
        if key in raw_lower:
            return canonical
    return raw_value.strip() if raw_value.strip() else "Unknown"


def extract_amenities(raw: dict, source: str) -> list[str]:
    """Extract a standardized amenities list from raw source data."""
    found = []

    if source == "ridb":
        desc = (raw.get("description") or "").lower()
        for amenity, keywords in AMENITY_KEYWORDS.items():
            for kw in keywords:
                if kw.lower() in desc:
                    found.append(amenity)
                    break

    elif source == "osm":
        tags = raw.get("tags", raw)
        tag_amenity_map = {
            "drinking_water": "drinking_water",
            "toilets": "toilets",
            "openfire": "fire_pit",
            "firepit": "fire_pit",
            "picnic_table": "picnic_table",
            "electricity": "electricity",
            "shower": "shower",
            "waste_disposal": "trash",
            "internet_access": "wifi",
        }
        for tag_key, amenity_name in tag_amenity_map.items():
            val = tags.get(tag_key, "")
            if val and val.lower() not in ("no", "none", ""):
                found.append(amenity_name)

    elif source == "blm":
        yn_map = {
            "TOILET_YN": "toilets",
            "WATER_YN": "drinking_water",
            "TRASH_YN": "trash",
        }
        for field_name, amenity_name in yn_map.items():
            if raw.get(field_name, "").upper() == "Y":
                found.append(amenity_name)

    elif source == "usfs":
        desc = (raw.get("description") or "").lower()
        for amenity, keywords in AMENITY_KEYWORDS.items():
            for kw in keywords:
                if kw.lower() in desc:
                    found.append(amenity)
                    break

    return list(set(found))


def normalize_ridb(raw: dict) -> CampSpot | None:
    """Normalize a raw RIDB facility dict to CampSpot."""
    try:
        lat = raw.get("lat") or raw.get("FacilityLatitude")
        lon = raw.get("lon") or raw.get("FacilityLongitude")
        if not lat or not lon:
            return None

        name = raw.get("name") or raw.get("FacilityName") or "Unnamed RIDB Site"
        source_id = raw.get("source_id") or raw.get("FacilityID")

        photos = []
        for p in raw.get("photo_urls", []):
            if isinstance(p, dict):
                photos.append(p)
            elif isinstance(p, str):
                photos.append({"url": p, "source": "ridb", "attribution": "Recreation.gov / RIDB", "is_public_domain": True})

        return CampSpot(
            id=f"ridb_{source_id}",
            name=name,
            lat=float(lat),
            lon=float(lon),
            description=raw.get("description") or "",
            amenities=extract_amenities(raw, "ridb"),
            access_notes=raw.get("directions") or "",
            land_manager=resolve_land_manager(raw.get("land_manager") or raw.get("org_name")),
            is_free=True,
            stay_limit=raw.get("stay_limit"),
            photo_urls=photos,
            source_url=raw.get("source_url") or f"https://www.recreation.gov/camping/campgrounds/{source_id}",
            source="ridb",
            scraped_at=raw.get("scraped_at") or datetime.now(timezone.utc).isoformat(),
            state=raw.get("state") or "",
            raw_data=raw.get("raw", {}),
        )
    except Exception as e:
        logger.warning(f"Failed to normalize RIDB record: {e}")
        return None


def normalize_osm(raw: dict) -> CampSpot | None:
    """Normalize a raw OSM element dict to CampSpot."""
    try:
        lat = raw.get("lat")
        lon = raw.get("lon")
        if not lat or not lon:
            return None

        tags = raw.get("raw", {}).get("tags", {}) if "raw" in raw else raw.get("tags", {})
        name = raw.get("name") or tags.get("name") or "Unnamed OSM Camp Site"
        source_id = raw.get("source_id") or raw.get("id")

        desc_parts = []
        if tags.get("description"):
            desc_parts.append(tags["description"])
        if tags.get("note"):
            desc_parts.append(tags["note"])
        camp_type = tags.get("camp_site", "")
        if camp_type:
            desc_parts.insert(0, f"Type: {camp_type}")

        amenities = raw.get("amenities", [])
        if not amenities:
            amenities = extract_amenities({"tags": tags}, "osm")

        access_parts = []
        if tags.get("access"):
            access_parts.append(f"Access: {tags['access']}")
        if tags.get("4wd_only") == "yes":
            access_parts.append("4WD required")
        if tags.get("surface"):
            access_parts.append(f"Surface: {tags['surface']}")

        return CampSpot(
            id=f"osm_{source_id}",
            name=name,
            lat=float(lat),
            lon=float(lon),
            description="; ".join(desc_parts),
            amenities=amenities,
            access_notes="; ".join(access_parts),
            land_manager=resolve_land_manager(raw.get("land_manager") or tags.get("operator")),
            is_free=True,
            stay_limit=raw.get("stay_limit") or tags.get("stay:max") or tags.get("maxstay"),
            photo_urls=[],
            source_url=raw.get("source_url") or f"https://www.openstreetmap.org/node/{source_id}",
            source="osm",
            scraped_at=raw.get("scraped_at") or datetime.now(timezone.utc).isoformat(),
            state=raw.get("state") or "",
            raw_data=raw.get("raw", {}),
        )
    except Exception as e:
        logger.warning(f"Failed to normalize OSM record: {e}")
        return None


def normalize_blm(raw: dict) -> CampSpot | None:
    """Normalize a raw BLM record dict to CampSpot."""
    try:
        lat = raw.get("lat")
        lon = raw.get("lon")
        if not lat or not lon:
            return None

        name = raw.get("name") or "Unnamed BLM Site"
        source_id = raw.get("source_id")

        return CampSpot(
            id=f"blm_{source_id}",
            name=name,
            lat=float(lat),
            lon=float(lon),
            description=raw.get("description") or "",
            amenities=extract_amenities(raw, "blm"),
            access_notes="",
            land_manager="BLM",
            is_free=True,
            stay_limit="14 days (typical BLM limit)",
            photo_urls=[],
            source_url=raw.get("source_url") or "https://www.blm.gov/visit",
            source="blm",
            scraped_at=raw.get("scraped_at") or datetime.now(timezone.utc).isoformat(),
            state=raw.get("state") or "",
            raw_data=raw.get("raw", {}),
        )
    except Exception as e:
        logger.warning(f"Failed to normalize BLM record: {e}")
        return None


def normalize_usfs(raw: dict) -> CampSpot | None:
    """Normalize a raw USFS record dict to CampSpot."""
    try:
        lat = raw.get("lat")
        lon = raw.get("lon")
        if not lat or not lon:
            return None

        name = raw.get("name") or "Unnamed USFS Site"
        source_id = raw.get("source_id")

        desc_parts = []
        if raw.get("description"):
            desc_parts.append(raw["description"])
        if raw.get("forest_name"):
            desc_parts.append(f"Forest: {raw['forest_name']}")
        if raw.get("district_name"):
            desc_parts.append(f"District: {raw['district_name']}")

        return CampSpot(
            id=f"usfs_{source_id}",
            name=name,
            lat=float(lat),
            lon=float(lon),
            description="; ".join(desc_parts),
            amenities=extract_amenities(raw, "usfs"),
            access_notes="",
            land_manager="USFS",
            is_free=True,
            stay_limit=raw.get("stay_limit") or "14 days (typical USFS limit)",
            photo_urls=[],
            source_url=raw.get("source_url") or "https://www.fs.usda.gov/",
            source="usfs",
            scraped_at=raw.get("scraped_at") or datetime.now(timezone.utc).isoformat(),
            state=raw.get("state") or "",
            raw_data=raw.get("raw", {}),
        )
    except Exception as e:
        logger.warning(f"Failed to normalize USFS record: {e}")
        return None


NORMALIZERS = {
    "ridb": normalize_ridb,
    "osm": normalize_osm,
    "blm": normalize_blm,
    "usfs": normalize_usfs,
}


def normalize_all(raw_records: list[dict], source: str) -> list[CampSpot]:
    """
    Normalize a list of raw records from a specific source.

    Args:
        raw_records: List of raw dicts from a collector.
        source: Source identifier ("ridb", "osm", "blm", "usfs").

    Returns:
        List of CampSpot objects (invalid records are filtered out).
    """
    normalizer = NORMALIZERS.get(source)
    if not normalizer:
        logger.error(f"No normalizer registered for source: {source}")
        return []

    results = []
    failed = 0
    for record in raw_records:
        spot = normalizer(record)
        if spot:
            results.append(spot)
        else:
            failed += 1

    logger.info(f"Normalized {len(results)}/{len(raw_records)} {source} records ({failed} failed)")
    return results
