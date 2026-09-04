"""
Base collector with rate limiting, retries, checkpointing, and structured logging.
"""

import json
import logging
import time
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any

import httpx

from pipeline.config.settings import (
    CHECKPOINTS_DIR,
    LOG_FORMAT,
    LOG_LEVEL,
    RATE_LIMITS,
    RAW_DIR,
)


class BaseCollector(ABC):
    """Abstract base class for all data source collectors."""

    def __init__(self, source_name: str | None = None) -> None:
        self.source_name = source_name or self.__class__.__name__.lower().replace("collector", "")
        self.last_request_time: float = 0.0

        # Set up logger
        self.logger = logging.getLogger(f"collector.{self.source_name}")

        # Create directories if they don't exist
        RAW_DIR.mkdir(parents=True, exist_ok=True)
        CHECKPOINTS_DIR.mkdir(parents=True, exist_ok=True)

        self.client = httpx.Client(
            timeout=60.0,
            follow_redirects=True,
            headers={"User-Agent": "CampRoo-FreeCampingPipeline/1.0 (research; contact@camproo.com)"},
        )

    @abstractmethod
    def collect(self, states: list[str] | None = None) -> list[dict[str, Any]]:
        """Collect data for the given states. Override in subclasses."""
        ...

    def _rate_limit(self, source: str | None = None) -> None:
        """Sleep to respect rate limit for the given source."""
        key = source or self.source_name
        rate_limit = RATE_LIMITS.get(key, 1.0)
        now = time.time()
        elapsed = now - self.last_request_time
        if elapsed < rate_limit:
            wait = rate_limit - elapsed
            self.logger.debug(f"Rate limiting: sleeping {wait:.1f}s")
            time.sleep(wait)
        self.last_request_time = time.time()

    def _retry_request(
        self, method: str, url: str, max_retries: int = 3, **kwargs: Any
    ) -> httpx.Response:
        """Make an HTTP request with exponential backoff retry."""
        backoff = 2
        for attempt in range(max_retries):
            try:
                self.logger.debug(f"Request {method} {url} (attempt {attempt + 1})")
                response = self.client.request(method, url, **kwargs)
                response.raise_for_status()
                return response
            except httpx.HTTPStatusError as e:
                status = e.response.status_code
                if status == 429:
                    wait = backoff * (attempt + 1) * 5  # Longer wait for rate limits
                    self.logger.warning(f"Rate limited (429). Waiting {wait}s...")
                    time.sleep(wait)
                elif status >= 500:
                    self.logger.warning(f"Server error {status}. Retrying in {backoff}s...")
                    time.sleep(backoff)
                    backoff *= 2
                else:
                    raise  # Don't retry client errors (400, 403, 404)
            except httpx.TimeoutException:
                self.logger.warning(f"Timeout on attempt {attempt + 1}. Retrying in {backoff}s...")
                time.sleep(backoff)
                backoff *= 2
            except httpx.RequestError as e:
                self.logger.warning(f"Request error: {e}. Retrying in {backoff}s...")
                if attempt == max_retries - 1:
                    raise
                time.sleep(backoff)
                backoff *= 2

        raise RuntimeError(f"Max retries ({max_retries}) exceeded for {method} {url}")

    def _save_checkpoint(self, state: str, data: list[dict[str, Any]]) -> None:
        """Save intermediate results for a state to enable resume."""
        path = CHECKPOINTS_DIR / f"{self.source_name}_{state}.json"
        with path.open("w", encoding="utf-8") as f:
            json.dump(data, f)
        self.logger.debug(f"Saved checkpoint: {path} ({len(data)} records)")

    def _load_checkpoint(self, state: str) -> list[dict[str, Any]] | None:
        """Load checkpoint for a state if it exists."""
        path = CHECKPOINTS_DIR / f"{self.source_name}_{state}.json"
        if path.exists():
            self.logger.info(f"Resuming from checkpoint: {path}")
            with path.open("r", encoding="utf-8") as f:
                return json.load(f)
        return None

    def _save_raw(self, filename: str, data: list[dict[str, Any]]) -> None:
        """Save collected raw data to a JSON file."""
        if not filename.endswith(".json"):
            filename = f"{filename}.json"
        path = RAW_DIR / filename
        with path.open("w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        self.logger.info(f"Saved raw data: {path} ({len(data)} records)")
