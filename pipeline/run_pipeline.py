#!/usr/bin/env python3
"""
US Free Camping Data Pipeline — Main Runner

Orchestrates data collection from multiple official sources,
normalization, deduplication, and export.

Usage:
    python run_pipeline.py --states CO,UT --sources ridb,osm,blm,usfs
    python run_pipeline.py --all-states --skip-freecampsites
    python run_pipeline.py --states CA --dry-run
"""

import argparse
import json
import logging
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

# Add pipeline root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from pipeline.config.settings import (
    DATA_DIR, RAW_DIR, PROCESSED_DIR, EXPORTS_DIR,
    LOG_FORMAT, LOG_LEVEL,
)
from pipeline.config.states import US_STATES
from pipeline.processors.normalizer import normalize_all, CampSpot
from pipeline.processors.deduplicator import deduplicate
from pipeline.processors.image_handler import process_images
from pipeline.exporters.geojson_exporter import export_geojson
from pipeline.exporters.csv_exporter import export_csv
from pipeline.exporters.camproo_converter import export_camproo_json
from pipeline.exporters.report_generator import generate_report


def setup_logging(log_level: str = "INFO") -> None:
    """Configure logging for the pipeline."""
    logging.basicConfig(
        level=getattr(logging, log_level.upper(), logging.INFO),
        format=LOG_FORMAT,
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler(DATA_DIR / "pipeline.log", mode="a"),
        ],
    )


def parse_args() -> argparse.Namespace:
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(
        description="US Free Camping Data Pipeline",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python run_pipeline.py --states CO,UT
  python run_pipeline.py --all-states --sources ridb,usfs,blm
  python run_pipeline.py --states CA --download-images
  python run_pipeline.py --all-states --skip-freecampsites
        """,
    )
    parser.add_argument(
        "--states",
        type=str,
        default=None,
        help="Comma-separated state codes (e.g., CO,UT,CA). Default: all states.",
    )
    parser.add_argument(
        "--all-states",
        action="store_true",
        help="Process all 50 states + DC.",
    )
    parser.add_argument(
        "--sources",
        type=str,
        default="ridb,osm,blm,usfs",
        help="Comma-separated sources to enable (ridb,osm,blm,usfs,freecampsites). Default: ridb,osm,blm,usfs",
    )
    parser.add_argument(
        "--skip-freecampsites",
        action="store_true",
        help="Skip freecampsites.net collector.",
    )
    parser.add_argument(
        "--download-images",
        action="store_true",
        help="Download public-domain agency images locally.",
    )
    parser.add_argument(
        "--enrich-wikimedia",
        action="store_true",
        default=True,
        help="Enrich photo-less spots with public domain/CC images from Wikimedia Commons. Default: True",
    )
    parser.add_argument(
        "--max-photo-lookups",
        type=int,
        default=1000,
        help="Maximum spots to geosearch on Wikimedia Commons for photos. Default: 1000",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Run without writing export files (still collects and normalizes).",
    )
    parser.add_argument(
        "--log-level",
        type=str,
        default="INFO",
        choices=["DEBUG", "INFO", "WARNING", "ERROR"],
        help="Logging level. Default: INFO",
    )
    parser.add_argument(
        "--dedup-distance",
        type=float,
        default=100.0,
        help="Deduplication distance in meters. Default: 100",
    )
    parser.add_argument(
        "--dedup-name-threshold",
        type=float,
        default=80.0,
        help="Fuzzy name match threshold (0-100). Default: 80",
    )
    return parser.parse_args()


def run_collectors(
    sources: list[str],
    states: list[str] | None,
    logger: logging.Logger,
) -> dict[str, list[dict]]:
    """
    Run enabled collectors and return raw results keyed by source.

    Args:
        sources: List of source names to enable.
        states: List of state codes to process, or None for all.

    Returns:
        Dict mapping source name to list of raw result dicts.
    """
    results: dict[str, list[dict]] = {}

    if "ridb" in sources:
        try:
            from pipeline.collectors.ridb_collector import RIDBCollector
            logger.info("=" * 60)
            logger.info("Running RIDB collector...")
            collector = RIDBCollector()
            raw = collector.collect(states=states)
            results["ridb"] = raw
            logger.info(f"RIDB collected: {len(raw)} records")
        except Exception as e:
            logger.error(f"RIDB collector failed: {e}", exc_info=True)
            results["ridb"] = []

    if "usfs" in sources:
        try:
            from pipeline.collectors.usfs_collector import USFSCollector
            logger.info("=" * 60)
            logger.info("Running USFS collector...")
            collector = USFSCollector()
            raw = collector.collect(states=states)
            results["usfs"] = raw
            logger.info(f"USFS collected: {len(raw)} records")
        except Exception as e:
            logger.error(f"USFS collector failed: {e}", exc_info=True)
            results["usfs"] = []

    if "blm" in sources:
        try:
            from pipeline.collectors.blm_collector import BLMCollector
            logger.info("=" * 60)
            logger.info("Running BLM collector...")
            collector = BLMCollector()
            raw = collector.collect(states=states)
            results["blm"] = raw
            logger.info(f"BLM collected: {len(raw)} records")
        except Exception as e:
            logger.error(f"BLM collector failed: {e}", exc_info=True)
            results["blm"] = []

    if "osm" in sources:
        try:
            from pipeline.collectors.osm_collector import OSMCollector
            logger.info("=" * 60)
            logger.info("Running OSM collector...")
            collector = OSMCollector()
            raw = collector.collect(states=states)
            results["osm"] = raw
            logger.info(f"OSM collected: {len(raw)} records")
        except Exception as e:
            logger.error(f"OSM collector failed: {e}", exc_info=True)
            results["osm"] = []

    if "freecampsites" in sources:
        try:
            from pipeline.collectors.freecampsites_collector import FreecampsitesCollector
            logger.info("=" * 60)
            logger.info("Running freecampsites.net collector...")
            collector = FreecampsitesCollector()
            raw = collector.collect(states=states)
            results["freecampsites"] = raw
            logger.info(f"freecampsites.net collected: {len(raw)} records")
        except Exception as e:
            logger.error(f"freecampsites.net collector failed: {e}", exc_info=True)
            results["freecampsites"] = []

    return results


def main() -> None:
    """Main pipeline entry point."""
    args = parse_args()

    # Ensure data directories exist
    for d in [DATA_DIR, RAW_DIR, PROCESSED_DIR, EXPORTS_DIR]:
        d.mkdir(parents=True, exist_ok=True)

    setup_logging(args.log_level)
    logger = logging.getLogger("pipeline")

    start_time = time.time()
    logger.info("=" * 60)
    logger.info("🏕️  US Free Camping Data Pipeline")
    logger.info("=" * 60)

    # Determine states
    states = None
    if args.states:
        states = [s.strip().upper() for s in args.states.split(",")]
        invalid = [s for s in states if s not in US_STATES]
        if invalid:
            logger.error(f"Invalid state codes: {invalid}")
            sys.exit(1)
        logger.info(f"Processing states: {', '.join(states)}")
    elif args.all_states:
        states = None  # All states
        logger.info("Processing all states")
    else:
        logger.info("No states specified — processing all states")

    # Determine sources
    sources = [s.strip().lower() for s in args.sources.split(",")]
    if args.skip_freecampsites and "freecampsites" in sources:
        sources.remove("freecampsites")
    logger.info(f"Enabled sources: {', '.join(sources)}")

    # Step 1: Collect
    logger.info("")
    logger.info("STEP 1: Collecting from data sources...")
    raw_results = run_collectors(sources, states, logger)

    total_raw = sum(len(v) for v in raw_results.values())
    logger.info(f"\nTotal raw records collected: {total_raw}")
    for source, records in raw_results.items():
        logger.info(f"  {source}: {len(records)}")

    if total_raw == 0:
        logger.warning("No records collected. Check API keys and network connectivity.")
        sys.exit(1)

    # Step 2: Normalize
    logger.info("")
    logger.info("STEP 2: Normalizing records to unified schema...")
    all_spots: list[CampSpot] = []
    for source, records in raw_results.items():
        normalized = normalize_all(records, source)
        all_spots.extend(normalized)

    logger.info(f"Total normalized spots: {len(all_spots)}")
    pre_dedup_count = len(all_spots)

    # Step 3: Deduplicate
    logger.info("")
    logger.info("STEP 3: Deduplicating...")
    deduped_spots = deduplicate(
        all_spots,
        distance_meters=args.dedup_distance,
        name_threshold=args.dedup_name_threshold,
    )
    logger.info(f"After deduplication: {len(deduped_spots)} unique spots")

    # Step 4: Process images
    logger.info("")
    logger.info("STEP 4: Processing images...")
    deduped_spots = process_images(
        deduped_spots,
        download_agency=args.download_images,
        enrich_wikimedia=args.enrich_wikimedia,
        max_wikimedia_lookups=args.max_photo_lookups,
    )

    # Save processed data
    processed_path = PROCESSED_DIR / "all_spots_processed.json"
    with open(processed_path, "w") as f:
        json.dump([s.to_dict() for s in deduped_spots], f, indent=2)
    logger.info(f"Saved processed data: {processed_path}")

    if args.dry_run:
        logger.info("DRY RUN — skipping export")
    else:
        # Step 5: Export
        logger.info("")
        logger.info("STEP 5: Exporting...")

        geojson_files = export_geojson(deduped_spots)
        logger.info(f"GeoJSON files: {len(geojson_files)}")

        csv_path = export_csv(deduped_spots)
        logger.info(f"CSV: {csv_path}")

        camproo_path = export_camproo_json(deduped_spots)
        logger.info(f"CampRoo JSON: {camproo_path}")

        # Step 6: Report
        logger.info("")
        logger.info("STEP 6: Generating report...")
        report_path = generate_report(deduped_spots, pre_dedup_count=pre_dedup_count)
        logger.info(f"Report: {report_path}")

    # Summary
    elapsed = time.time() - start_time
    logger.info("")
    logger.info("=" * 60)
    logger.info(f"✅ Pipeline complete in {elapsed:.1f}s")
    logger.info(f"   Total unique spots: {len(deduped_spots):,}")
    logger.info(f"   Sources used: {', '.join(raw_results.keys())}")
    if states:
        logger.info(f"   States processed: {', '.join(states)}")
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
