"""
Global configuration for the US Free Camping Data Pipeline.
"""

import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

# API Base URLs
RIDB_API_URL = "https://ridb.recreation.gov/api/v1"
RIDB_BASE_URL = RIDB_API_URL  # Alias for backward compat with collectors
OVERPASS_URL = "https://overpass-api.de/api/interpreter"
OVERPASS_API_URL = OVERPASS_URL  # Alias
BLM_REST_URL = "https://gis.blm.gov/arcgis/rest/services/recreation/BLM_Natl_Recreation_Sites/MapServer/0/query"
USFS_SHAPEFILE_URL = "https://data.fs.usda.gov/geodata/edw/edw_resources/shp/S_USA.RecreationSites.zip"
USFS_REC_SITES_URL = USFS_SHAPEFILE_URL  # Alias

# Rate Limits (seconds between requests)
RATE_LIMITS = {
    "ridb": 1.0,
    "overpass": 30.0,
    "blm": 2.0,
    "usfs": 0.0,  # Local file processing, no rate limit needed
    "freecampsites": 5.0,
}

# Deduplication Config
DEDUP_DISTANCE_METERS = 100
DEDUP_NAME_THRESHOLD = 80

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
RAW_DIR = DATA_DIR / "raw"
PROCESSED_DIR = DATA_DIR / "processed"
EXPORTS_DIR = DATA_DIR / "exports"
IMAGES_DIR = DATA_DIR / "images"
CHECKPOINTS_DIR = DATA_DIR / "checkpoints"

# US Bounding Box (continental)
US_BBOX = {
    "lat_min": 24.396,
    "lat_max": 49.384,
    "lon_min": -125.0,
    "lon_max": -66.935,
}

# Logging
LOG_FORMAT = "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
LOG_LEVEL = "INFO"

# API Keys (loaded from .env)
RIDB_API_KEY = os.environ.get("RIDB_API_KEY", "")
