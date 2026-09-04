import os
import logging
import httpx
from typing import List, Dict, Any, Optional

from pipeline.collectors.base import BaseCollector

try:
    from pipeline.config.settings import RATE_LIMITS
except ImportError:
    RATE_LIMITS = {'blm': 1.0}

logger = logging.getLogger(__name__)

# BLM Recs_pts MapServer endpoint
# Layer 4: Campsite - Primitive (1,386 sites total, ~1,287 No Fee)
# Layer 3: Campsite - Developed (1,462 sites total, ~322 No Fee)
BLM_BASE_URL = 'https://gis.blm.gov/arcgis/rest/services/recreation/BLM_Natl_Recs_pts/MapServer'

class BLMCollector(BaseCollector):
    """Collector for Bureau of Land Management (BLM) Recreation Sites via ArcGIS REST API."""
    
    def __init__(self):
        super().__init__('blm')
        self.rate_limit_delay = RATE_LIMITS.get('blm', 1.0)
        
    def _fetch_layer(self, layer_id: int, states: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """Fetch free camping points from a specific BLM layer with pagination."""
        query_url = f"{BLM_BASE_URL}/{layer_id}/query"
        
        where_clauses = ["FET_SUBTYPE LIKE '%No Fee%'"]
        if states:
            states_quoted = ", ".join(f"'{s.upper()}'" for s in states)
            where_clauses.append(f"ADMIN_ST IN ({states_quoted})")
            
        where_sql = " AND ".join(where_clauses)
        
        offset = 0
        limit = 1000
        features = []
        
        while True:
            params = {
                'where': where_sql,
                'outFields': '*',
                'f': 'json',
                'resultRecordCount': limit,
                'resultOffset': offset
            }
            
            try:
                self._rate_limit('blm')
                response = self.client.get(query_url, params=params, timeout=30.0)
                response.raise_for_status()
                data = response.json()
                
                if 'error' in data:
                    logger.error(f"BLM Layer {layer_id} API Error: {data['error']}")
                    break
                    
                cur_features = data.get('features', [])
                if not cur_features:
                    break
                    
                features.extend(cur_features)
                if len(cur_features) < limit:
                    break
                    
                offset += limit
            except Exception as e:
                logger.error(f"Failed to fetch BLM Layer {layer_id} at offset {offset}: {e}")
                break
                
        logger.info(f"BLM Layer {layer_id} yielded {len(features)} raw features")
        return features

    def collect(self, states: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """Collect and normalize BLM free camping sites."""
        raw_file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data', 'raw', 'blm_camping.json')
        if os.path.exists(raw_file):
            logger.info(f"Loading existing BLM raw dataset from {raw_file}")
            import json
            with open(raw_file, 'r', encoding='utf-8') as f:
                cached = json.load(f)
            if states:
                target_states = [s.upper() for s in states]
                return [s for s in cached if s.get('state') in target_states]
            return cached

        logger.info("Starting BLM free camping collection via ArcGIS REST API")
        
        results = []
        state_counts = {}
        
        # Query Primitive (Layer 4) and Developed No Fee (Layer 3)
        for layer_id in [4, 3]:
            raw_features = self._fetch_layer(layer_id, states=states)
            for feat in raw_features:
                attrs = feat.get('attributes', {})
                geom = feat.get('geometry', {})
                
                # Coordinate resolution: check geometry or LAT/LONG fields
                lat = attrs.get('LAT') or geom.get('y')
                lon = attrs.get('LONG') or geom.get('x')
                
                if lat is None or lon is None:
                    continue
                    
                try:
                    lat = float(lat)
                    lon = float(lon)
                except (ValueError, TypeError):
                    continue
                    
                # Basic US boundary sanity check
                if not (24.0 <= lat <= 50.0 and -125.0 <= lon <= -65.0):
                    continue
                    
                name = attrs.get('FET_NAME') or attrs.get('UNIT_NAME') or 'Unnamed BLM Campsite'
                subtype = attrs.get('FET_SUBTYPE', 'Primitive Campsite')
                state = (attrs.get('ADMIN_ST') or 'Unknown').strip().upper()
                obj_id = attrs.get('OBJECTID') or attrs.get('Original_GlobalID')
                
                desc_parts = [subtype]
                if attrs.get('UNIT_NAME'):
                    desc_parts.append(f"Unit: {attrs['UNIT_NAME']}")
                if attrs.get('DESCRIPTION'):
                    desc_parts.append(attrs['DESCRIPTION'])
                description = " - ".join(desc_parts)
                
                state_counts[state] = state_counts.get(state, 0) + 1
                
                site_info = {
                    'source': 'blm',
                    'source_id': f"blm_{obj_id}",
                    'name': str(name),
                    'lat': lat,
                    'lon': lon,
                    'description': description,
                    'land_manager': 'BLM',
                    'amenities': ['toilets'] if 'toilet' in subtype.lower() else [],
                    'access_notes': subtype,
                    'is_free': True,
                    'stay_limit': '14 days (typical BLM limit)',
                    'state': state,
                    'source_url': attrs.get('WEB_LINK') or 'https://www.blm.gov/visit',
                    'photo_urls': [],
                    'raw': attrs
                }
                results.append(site_info)
                
        logger.info(f"Extracted {len(results)} verified BLM free camping sites")
        logger.info(f"State breakdown: {state_counts}")
        
        self._save_raw('blm_camping.json', results)
        return results

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    collector = BLMCollector()
    sites = collector.collect(['CO', 'UT'])
    print(f"Collected {len(sites)} sites in CO & UT. First site: {sites[0] if sites else 'None'}")
