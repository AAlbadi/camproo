"""
Deduplicator: Removes duplicate camping spots across sources using
geographic proximity and fuzzy name matching.
"""

import logging
from collections import defaultdict
from math import radians, sin, cos, sqrt, atan2
from typing import Optional

from rapidfuzz import fuzz

from pipeline.processors.normalizer import CampSpot

logger = logging.getLogger(__name__)

# Source priority: higher = preferred when merging duplicates
SOURCE_PRIORITY = {
    "ridb": 5,
    "usfs": 4,
    "blm": 3,
    "osm": 2,
    "freecampsites": 1,
}


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great-circle distance in meters between two points
    on Earth using the Haversine formula.
    """
    R = 6_371_000  # Earth radius in meters
    phi1, phi2 = radians(lat1), radians(lat2)
    dphi = radians(lat2 - lat1)
    dlambda = radians(lon2 - lon1)

    a = sin(dphi / 2) ** 2 + cos(phi1) * cos(phi2) * sin(dlambda / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return R * c


def _grid_key(lat: float, lon: float, cell_size: float = 0.01) -> tuple[int, int]:
    """
    Compute a spatial grid cell key for approximate neighbor lookups.
    Default cell_size ~1.1 km at equator, well above our 100m dedup threshold.
    """
    return (int(lat / cell_size), int(lon / cell_size))


def find_clusters(spots: list[CampSpot], distance_meters: float = 100.0) -> list[list[CampSpot]]:
    """
    Group spots into clusters where any member is within `distance_meters` of
    another member. Uses a spatial grid index for efficient O(n) average lookup.

    Returns:
        List of clusters (each cluster is a list of CampSpot).
    """
    # Build spatial grid index
    grid: dict[tuple[int, int], list[int]] = defaultdict(list)
    for idx, spot in enumerate(spots):
        key = _grid_key(spot.lat, spot.lon)
        grid[key].append(idx)

    # Union-Find for clustering
    parent = list(range(len(spots)))

    def find(x: int) -> int:
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    def union(a: int, b: int) -> None:
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[ra] = rb

    # Check neighbors in adjacent grid cells
    for idx, spot in enumerate(spots):
        key = _grid_key(spot.lat, spot.lon)
        for di in (-1, 0, 1):
            for dj in (-1, 0, 1):
                neighbor_key = (key[0] + di, key[1] + dj)
                for other_idx in grid.get(neighbor_key, []):
                    if other_idx <= idx:
                        continue
                    other = spots[other_idx]
                    dist = haversine_distance(spot.lat, spot.lon, other.lat, other.lon)
                    if dist <= distance_meters:
                        union(idx, other_idx)

    # Group by root
    clusters_map: dict[int, list[CampSpot]] = defaultdict(list)
    for idx, spot in enumerate(spots):
        root = find(idx)
        clusters_map[root].append(spot)

    return list(clusters_map.values())


def _name_similarity(name1: str, name2: str) -> float:
    """Compute fuzzy name similarity score (0-100)."""
    if not name1 or not name2:
        return 0.0
    return fuzz.token_sort_ratio(name1.lower().strip(), name2.lower().strip())


def merge_cluster(cluster: list[CampSpot], name_threshold: float = 80.0) -> CampSpot:
    """
    Merge a cluster of nearby spots into a single canonical CampSpot.

    Strategy:
    - Pick the highest-priority source as the primary record
    - Merge amenities, photos, and descriptions from all sources
    - Keep the most informative name and description
    """
    if len(cluster) == 1:
        return cluster[0]

    # Sort by source priority (highest first)
    cluster.sort(key=lambda s: SOURCE_PRIORITY.get(s.source, 0), reverse=True)
    primary = cluster[0]

    # Collect all unique amenities
    all_amenities = set(primary.amenities)
    all_photos = list(primary.photo_urls)
    all_sources = {primary.source}
    seen_photo_urls = {p.get("url", "") for p in all_photos}

    description_parts = [primary.description] if primary.description else []

    for spot in cluster[1:]:
        all_sources.add(spot.source)

        # Merge amenities
        all_amenities.update(spot.amenities)

        # Merge photos (avoid duplicates by URL)
        for photo in spot.photo_urls:
            url = photo.get("url", "")
            if url and url not in seen_photo_urls:
                all_photos.append(photo)
                seen_photo_urls.add(url)

        # Use longer name if primary name is generic
        if len(spot.name) > len(primary.name) and "unnamed" in primary.name.lower():
            primary.name = spot.name

        # Use longer description if primary is short
        if spot.description and len(spot.description) > len(primary.description):
            description_parts.insert(0, spot.description)

        # Use more specific land manager
        if primary.land_manager == "Unknown" and spot.land_manager != "Unknown":
            primary.land_manager = spot.land_manager

        # Merge stay limit
        if not primary.stay_limit and spot.stay_limit:
            primary.stay_limit = spot.stay_limit

        # Merge access notes
        if spot.access_notes and spot.access_notes not in (primary.access_notes or ""):
            primary.access_notes = "; ".join(filter(None, [primary.access_notes, spot.access_notes]))

    # Update the primary with merged data
    primary.amenities = sorted(all_amenities)
    primary.photo_urls = all_photos
    if len(description_parts) > 1:
        primary.description = description_parts[0]  # Use the longest

    # Add cross-reference in ID
    if len(all_sources) > 1:
        primary.id = f"{primary.id}_merged_{'_'.join(sorted(all_sources - {primary.source}))}"

    return primary


def deduplicate(
    spots: list[CampSpot],
    distance_meters: float = 100.0,
    name_threshold: float = 80.0,
) -> list[CampSpot]:
    """
    Deduplicate a list of CampSpots by geographic proximity and name similarity.

    Args:
        spots: All spots from all sources, already normalized.
        distance_meters: Max distance to consider as potential duplicates.
        name_threshold: Min fuzzy name match score (0-100) for geo-close spots
                       to be considered duplicates. Set to 0 to merge all
                       geo-close spots regardless of name.

    Returns:
        Deduplicated list of CampSpot objects.
    """
    if not spots:
        return []

    logger.info(f"Deduplicating {len(spots)} spots (distance={distance_meters}m, name_threshold={name_threshold})")

    # Step 1: Find geographic clusters
    clusters = find_clusters(spots, distance_meters)
    single_count = sum(1 for c in clusters if len(c) == 1)
    multi_count = len(clusters) - single_count
    logger.info(f"Found {len(clusters)} geographic clusters ({single_count} unique, {multi_count} multi-source)")

    # Step 2: Within each cluster, sub-cluster by name similarity
    results = []
    merge_log = []

    for cluster in clusters:
        if len(cluster) == 1:
            results.append(cluster[0])
            continue

        # Check if names are similar enough to merge
        # For clusters of 2, directly check name similarity
        if len(cluster) == 2 and name_threshold > 0:
            sim = _name_similarity(cluster[0].name, cluster[1].name)
            if sim < name_threshold:
                # Names too different — keep both
                results.extend(cluster)
                continue

        # For larger clusters or matching pairs, merge
        merged = merge_cluster(cluster, name_threshold)
        results.append(merged)

        merge_log.append({
            "merged_id": merged.id,
            "merged_name": merged.name,
            "original_count": len(cluster),
            "sources": [s.source for s in cluster],
            "original_names": [s.name for s in cluster],
        })

    logger.info(f"Deduplication complete: {len(spots)} → {len(results)} spots ({len(spots) - len(results)} removed)")

    if merge_log:
        logger.info(f"Merged {len(merge_log)} clusters:")
        for entry in merge_log[:20]:  # Log first 20
            logger.debug(f"  {entry['merged_name']}: merged {entry['original_count']} from {entry['sources']}")

    return results
