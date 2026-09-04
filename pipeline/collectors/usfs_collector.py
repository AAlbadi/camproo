import os
import logging
import httpx
from typing import List, Dict, Any, Optional

from pipeline.collectors.base import BaseCollector
from pipeline.config.states import US_STATES

try:
    from pipeline.config.settings import RATE_LIMITS
except ImportError:
    RATE_LIMITS = {'usfs': 1.0}

logger = logging.getLogger(__name__)

# USFS EDW INFRA Recreation Sites MapServer
# Contains over 32,000 recreation sites nationwide, with ~12,380+ free/primitive camping sites
USFS_INFRA_QUERY_URL = "https://apps.fs.usda.gov/arcx/rest/services/EDW/EDW_InfraRecreationSites_01/MapServer/0/query"

def resolve_state_from_coords(lat: float, lon: float) -> str:
    """Resolve 2-letter state code using spatial bounding boxes."""
    candidates = []
    for st, data in US_STATES.items():
        s, w, n, e = data['bbox']
        if s <= lat <= n and w <= lon <= e:
            area = (n - s) * (e - w)
            candidates.append((area, st))
    if candidates:
        candidates.sort()
        return candidates[0][1]
    return 'US'

class USFSCollector(BaseCollector):
    """Collector for US Forest Service (USFS) Recreation Sites via the official EDW ArcGIS REST API."""
    
    def __init__(self):
        super().__init__('usfs')
        self.url = USFS_INFRA_QUERY_URL

    def collect(self, states: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """Collect free camping facilities from the USFS EDW REST API across states."""
        raw_file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data', 'raw', 'usfs_camping.json')
        if os.path.exists(raw_file):
            logger.info(f"Loading existing USFS raw dataset from {raw_file}")
            import json
            with open(raw_file, 'r', encoding='utf-8') as f:
                cached = json.load(f)
            if states:
                target_states = [s.upper() for s in states]
                return [s for s in cached if s.get('state') in target_states]
            return cached

        logger.info("Starting USFS recreation sites collection via EDW ArcGIS REST API")
        
        # Base filter: free camping
        where_clause = (
            "(site_subtype LIKE '%CAMP%' OR site_subtype LIKE '%DISPERSED%') AND "
            "(fee_charged = 'N' OR fee_charged IS NULL OR fee_description LIKE '%No fee%')"
        )
        logger.info(f"Querying USFS with filter: {where_clause}")
        
        offset = 0
        limit = 1000
        all_features = []
        
        while True:
            params = {
                'where': where_clause,
                'outFields': '*',
                'f': 'json',
                'resultRecordCount': limit,
                'resultOffset': offset
            }
            
            try:
                self._rate_limit('usfs')
                response = self.client.get(self.url, params=params, timeout=45.0)
                response.raise_for_status()
                data = response.json()
                
                if 'error' in data:
                    logger.error(f"USFS EDW API Error: {data['error']}")
                    break
                    
                features = data.get('features', [])
                if not features:
                    break
                    
                all_features.extend(features)
                logger.info(f"Retrieved {len(features)} USFS sites (offset {offset}, total: {len(all_features)})")
                
                if len(features) < limit:
                    break
                    
                offset += limit
            except Exception as e:
                logger.error(f"Failed to fetch USFS data at offset {offset}: {e}")
                break
                
        logger.info(f"Total USFS features retrieved: {len(all_features)}")
        
        results = []
        state_counts = {}
        target_states = [s.upper() for s in states] if states else None
        
        for feat in all_features:
            attrs = feat.get('attributes', {})
            geom = feat.get('geometry', {})
            
            lat = attrs.get('latitude') or geom.get('y')
            lon = attrs.get('longitude') or geom.get('x')
            
            if lat is None or lon is None:
                continue
                
            try:
                lat = float(lat)
                lon = float(lon)
            except (ValueError, TypeError):
                continue
                
            if not (24.0 <= lat <= 72.0 and -180.0 <= lon <= -65.0):
                continue
                
            # Derive state: first from text, fallback to coordinate bbox
            state = 'US'
            info_center = str(attrs.get('information_center') or '')
            closest = str(attrs.get('closest_towns') or '')
            combined_loc = f"{info_center} {closest}"
            for candidate in US_STATES.keys():
                if f" {candidate} " in combined_loc or f", {candidate}" in combined_loc or f" {candidate}," in combined_loc:
                    state = candidate
                    break
                    
            if state == 'US':
                state = resolve_state_from_coords(lat, lon)
                
            if target_states and state not in target_states:
                continue
                
            site_name = attrs.get('public_site_name') or attrs.get('site_name') or 'Unnamed USFS Site'
            recarea_name = attrs.get('recarea_name') or ''
            subtype = attrs.get('site_subtype', 'CAMPGROUND')
            desc = attrs.get('recarea_description') or attrs.get('important_info') or ''
            
            state_counts[state] = state_counts.get(state, 0) + 1
            
            # Amenities extraction
            amenities = []
            if attrs.get('water_availability') and 'yes' in str(attrs.get('water_availability')).lower():
                amenities.append('drinking_water')
            if attrs.get('restroom_availability') and 'none' not in str(attrs.get('restroom_availability')).lower():
                amenities.append('toilets')
            if attrs.get('fire_pit') and str(attrs.get('fire_pit')).upper() == 'Y':
                amenities.append('fire_pit')
            if attrs.get('picnic_table') and str(attrs.get('picnic_table')).upper() == 'Y':
                amenities.append('picnic_table')
            if attrs.get('pack_in_out') and str(attrs.get('pack_in_out')).upper() == 'Y':
                amenities.append('trash')
                
            stay_limit = attrs.get('restrictions') or '14 days (typical USFS limit)'
            
            site_info = {
                'source': 'usfs',
                'source_id': f"usfs_{attrs.get('site_id') or attrs.get('objectid')}",
                'name': str(site_name),
                'lat': lat,
                'lon': lon,
                'description': f"{subtype}: {desc}".strip(),
                'land_manager': 'USFS',
                'forest_name': recarea_name,
                'district_name': attrs.get('parent_recarea') or '',
                'amenities': amenities,
                'fee': str(attrs.get('fee_description') or 'No Fee'),
                'open_status': str(attrs.get('operational_hours') or 'Open'),
                'stay_limit': stay_limit,
                'state': state,
                'source_url': attrs.get('usda_portal_url') or 'https://www.fs.usda.gov/',
                'photo_urls': [],
                'raw': attrs
            }
            results.append(site_info)
            
        logger.info(f"Extracted {len(results)} valid USFS free camping sites")
        logger.info(f"State breakdown: {state_counts}")
        
        self._save_raw('usfs_camping.json', results)
        return results

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    collector = USFSCollector()
    sites = collector.collect(['CO', 'UT'])
    print(f"Collected {len(sites)} USFS sites in CO & UT. First site: {sites[0] if sites else 'None'}")
