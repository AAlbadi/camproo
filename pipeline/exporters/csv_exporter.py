"""
CSV Exporter: Exports CampSpots as a flat CSV file for easy inspection.
"""

import csv
import json
import logging
from pathlib import Path

from pipeline.config.settings import EXPORTS_DIR
from pipeline.processors.normalizer import CampSpot

logger = logging.getLogger(__name__)


def export_csv(
    spots: list[CampSpot],
    output_dir: str | None = None,
    filename: str = "all_free_camping_us.csv",
) -> str:
    """
    Export spots as a flat CSV file.

    Args:
        spots: List of CampSpot objects.
        output_dir: Output directory (defaults to EXPORTS_DIR).
        filename: Output filename.

    Returns:
        Path to the created CSV file.
    """
    out_dir = Path(output_dir or EXPORTS_DIR)
    out_dir.mkdir(parents=True, exist_ok=True)
    filepath = out_dir / filename

    fieldnames = [
        "id",
        "name",
        "lat",
        "lon",
        "description",
        "amenities",
        "access_notes",
        "land_manager",
        "is_free",
        "stay_limit",
        "photo_count",
        "photo_urls",
        "source_url",
        "source",
        "state",
        "scraped_at",
    ]

    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()

        for spot in spots:
            row = {
                "id": spot.id,
                "name": spot.name,
                "lat": spot.lat,
                "lon": spot.lon,
                "description": spot.description[:500] if spot.description else "",
                "amenities": ", ".join(spot.amenities),
                "access_notes": spot.access_notes,
                "land_manager": spot.land_manager,
                "is_free": spot.is_free,
                "stay_limit": spot.stay_limit or "",
                "photo_count": len(spot.photo_urls),
                "photo_urls": json.dumps([p.get("url", "") for p in spot.photo_urls]) if spot.photo_urls else "",
                "source_url": spot.source_url,
                "source": spot.source,
                "state": spot.state,
                "scraped_at": spot.scraped_at,
            }
            writer.writerow(row)

    logger.info(f"Exported CSV: {filepath} ({len(spots)} rows)")
    return str(filepath)
