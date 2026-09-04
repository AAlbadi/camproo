"""
GeoJSON Exporter: Exports CampSpots as GeoJSON FeatureCollections.
"""

import json
import logging
from pathlib import Path
from collections import defaultdict

from pipeline.config.settings import EXPORTS_DIR
from pipeline.processors.normalizer import CampSpot

logger = logging.getLogger(__name__)


def spot_to_feature(spot: CampSpot) -> dict:
    """Convert a CampSpot to a GeoJSON Feature."""
    return {
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": [spot.lon, spot.lat],  # GeoJSON uses [lon, lat]
        },
        "properties": {
            "id": spot.id,
            "name": spot.name,
            "description": spot.description,
            "amenities": spot.amenities,
            "access_notes": spot.access_notes,
            "land_manager": spot.land_manager,
            "is_free": spot.is_free,
            "stay_limit": spot.stay_limit,
            "photo_urls": spot.photo_urls,
            "source_url": spot.source_url,
            "source": spot.source,
            "state": spot.state,
            "scraped_at": spot.scraped_at,
        },
    }


def export_geojson(
    spots: list[CampSpot],
    output_dir: str | None = None,
    by_state: bool = True,
) -> list[str]:
    """
    Export spots as GeoJSON files.

    Args:
        spots: List of CampSpot objects.
        output_dir: Output directory (defaults to EXPORTS_DIR).
        by_state: If True, also create per-state files.

    Returns:
        List of created file paths.
    """
    out_dir = Path(output_dir or EXPORTS_DIR)
    out_dir.mkdir(parents=True, exist_ok=True)
    created_files = []

    # National file
    national_features = [spot_to_feature(s) for s in spots]
    national_collection = {
        "type": "FeatureCollection",
        "features": national_features,
        "metadata": {
            "total_spots": len(spots),
            "description": "US Free Camping Spots — CampRoo Pipeline",
        },
    }

    national_path = out_dir / "all_free_camping_us.geojson"
    with open(national_path, "w") as f:
        json.dump(national_collection, f, indent=2)
    created_files.append(str(national_path))
    logger.info(f"Exported national GeoJSON: {national_path} ({len(spots)} features)")

    # Per-state files
    if by_state:
        state_dir = out_dir / "by_state"
        state_dir.mkdir(parents=True, exist_ok=True)

        by_state_map: dict[str, list[CampSpot]] = defaultdict(list)
        for spot in spots:
            state = spot.state or "UNKNOWN"
            by_state_map[state].append(spot)

        for state_code, state_spots in sorted(by_state_map.items()):
            features = [spot_to_feature(s) for s in state_spots]
            collection = {
                "type": "FeatureCollection",
                "features": features,
                "metadata": {
                    "state": state_code,
                    "total_spots": len(state_spots),
                },
            }

            state_path = state_dir / f"{state_code.lower()}_free_camping.geojson"
            with open(state_path, "w") as f:
                json.dump(collection, f, indent=2)
            created_files.append(str(state_path))

        logger.info(f"Exported GeoJSON for {len(by_state_map)} states")

    return created_files
