"""
freecampsites.net collector — PLACEHOLDER / LOW PRIORITY

This collector is the lowest priority source. It should only be used
after verifying that robots.txt permits automated access and that
the site's Terms of Service allow data extraction.

For now, this is a no-op placeholder that logs a warning.
"""

import logging
from typing import Any

from pipeline.collectors.base import BaseCollector

logger = logging.getLogger(__name__)


class FreecampsitesCollector(BaseCollector):
    """
    Collector for freecampsites.net — LOW PRIORITY.

    This collector is disabled by default. Before enabling:
    1. Check robots.txt at freecampsites.net/robots.txt
    2. Review Terms of Service
    3. Only proceed if automated access is clearly permitted
    4. Never download user-uploaded photos
    """

    def collect(self, states: list[str] | None = None) -> list[dict[str, Any]]:
        """
        Placeholder collect — returns empty list with a warning.
        Enable only after ToS/robots.txt review.
        """
        logger.warning(
            "freecampsites.net collector is disabled by default. "
            "Check robots.txt and ToS before enabling. "
            "Official sources (RIDB, USFS, BLM, OSM) provide sufficient coverage."
        )
        return []
