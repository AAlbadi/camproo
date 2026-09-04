# 🏕️ US Free Camping Data Pipeline

Ethical, modular Python pipeline for collecting free/dispersed camping spots from official US government sources and OpenStreetMap. Targets ~10,000 unique spots with coordinates, descriptions, amenities, land manager, and image URLs.

## Data Sources (Priority Order)

1. **RIDB / Recreation.gov API** — Federal campgrounds from USFS, BLM, NPS, USACE
2. **USFS EDW Shapefiles** — National Forest recreation sites including dispersed camping
3. **BLM ArcGIS REST** — Bureau of Land Management recreation sites
4. **OpenStreetMap (Overpass API)** — Community-mapped free/dispersed camping nodes
5. **freecampsites.net** — (placeholder, disabled by default pending ToS review)

## Quick Start

```bash
# 1. Install dependencies
cd pipeline
pip install -r requirements.txt

# 2. Set up environment variables
cp .env.example .env
# Edit .env and add your RIDB API key from https://ridb.recreation.gov/

# 3. Run on a test state (no RIDB key needed for USFS/BLM/OSM)
python run_pipeline.py --states CO --sources osm,blm,usfs

# 4. Run with all sources including RIDB
python run_pipeline.py --states CO,UT --sources ridb,osm,blm,usfs

# 5. Run all states
python run_pipeline.py --all-states
```

## CLI Options

```
--states CO,UT,CA     Comma-separated state codes (default: all)
--all-states          Process all 50 states + DC
--sources ridb,osm    Comma-separated sources to enable
--skip-freecampsites  Skip freecampsites.net
--download-images     Download public-domain agency images locally
--dry-run             Collect and process without exporting
--log-level DEBUG     Set logging verbosity
--dedup-distance 100  Deduplication distance in meters
```

## Output

All output goes to `pipeline/data/`:

```
data/
├── raw/              # Raw collector output (JSON per source)
├── processed/        # Normalized + deduplicated spots
├── exports/
│   ├── all_free_camping_us.geojson   # National GeoJSON
│   ├── all_free_camping_us.csv       # Flat CSV
│   ├── camproo_spots.json            # CampRoo-compatible Spot[]
│   ├── pipeline_report.md            # Summary statistics
│   └── by_state/                     # Per-state GeoJSON files
├── images/           # Downloaded agency photos
└── checkpoints/      # Resume state for interrupted runs
```

## Output Schema

Each spot includes:
- `id`, `name`, `lat`, `lon`
- `description`, `amenities` list, `access_notes`
- `land_manager` (BLM, USFS, NPS, USACE, etc.)
- `is_free` (always true), `stay_limit`
- `photo_urls` with source attribution
- `source_url`, `source`, `state`, `scraped_at`

## Ethics & Legal

- ✅ Government data (RIDB, USFS, BLM) is public domain
- ✅ OSM data is ODbL-licensed — attribute "© OpenStreetMap contributors"
- ✅ Rate limiting on all API sources
- ✅ Checkpoint/resume for long runs
- ❌ No scraping behind logins
- ❌ No bulk downloading copyrighted user photos
- ❌ No ignoring robots.txt

## Architecture

```
pipeline/
├── config/           # Settings, state bounding boxes
├── collectors/       # One module per data source
├── processors/       # Normalize, deduplicate, handle images
├── exporters/        # GeoJSON, CSV, CampRoo, reports
└── run_pipeline.py   # CLI entry point
```
