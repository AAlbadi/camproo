import json
import logging
import httpx
from typing import Optional, List, Dict, Any
import time

from pipeline.config.settings import OVERPASS_URL, RATE_LIMITS
from pipeline.config.states import US_STATES
from pipeline.collectors.base import BaseCollector

logger = logging.getLogger(__name__)

class OSMCollector(BaseCollector):
    """
    Collector for OpenStreetMap free and dispersed camping sites via Overpass API.
    """

    def __init__(self):
        super().__init__()
        self.rate_limit = RATE_LIMITS.get('overpass', 30.0)

    def _build_query(self, state_name: str) -> str:
        """
        Build an Overpass QL query for a specific state.
        """
        return f"""
        [out:json][timeout:300];
        area["name"="{state_name}"]["admin_level"="4"]->.state;
        (
          node["tourism"="camp_site"]["fee"="no"](area.state);
          way["tourism"="camp_site"]["fee"="no"](area.state);
          node["tourism"="camp_site"]["camp_site"~"dispersed|basic|wild"](area.state);
          way["tourism"="camp_site"]["camp_site"~"dispersed|basic|wild"](area.state);
          node["tourism"="camp_site"]["backcountry"="yes"](area.state);
          way["tourism"="camp_site"]["backcountry"="yes"](area.state);
          node["tourism"="camp_site"]["informal"="yes"](area.state);
          way["tourism"="camp_site"]["informal"="yes"](area.state);
        );
        out body; >; out skel qt;
        """

    def _process_elements(self, elements: List[Dict[str, Any]], state_code: str) -> List[Dict[str, Any]]:
        """
        Process raw Overpass elements into our format.
        """
        # Build node lookup dict for resolving way centroids
        node_lookup = {}
        for elem in elements:
            if elem.get('type') == 'node':
                node_lookup[elem['id']] = (elem['lat'], elem['lon'])

        processed = []
        for elem in elements:
            elem_type = elem.get('type')
            tags = elem.get('tags', {})
            
            # We only care about elements with tags representing the campsites
            if not tags:
                continue

            elem_id = elem.get('id')
            
            # Determine lat/lon
            if elem_type == 'node':
                lat = elem.get('lat')
                lon = elem.get('lon')
            elif elem_type == 'way':
                # Compute centroid from referenced nodes
                nodes = elem.get('nodes', [])
                way_lats, way_lons = [], []
                for n_id in nodes:
                    if n_id in node_lookup:
                        way_lats.append(node_lookup[n_id][0])
                        way_lons.append(node_lookup[n_id][1])
                
                if not way_lats or not way_lons:
                    continue
                
                lat = sum(way_lats) / len(way_lats)
                lon = sum(way_lons) / len(way_lons)
            else:
                continue

            if lat is None or lon is None:
                continue

            name = tags.get('name', 'Unnamed Camp Site')
            description = " | ".join(filter(None, [
                tags.get('description', ''),
                tags.get('note', ''),
                f"Type: {tags.get('camp_site', '')}" if tags.get('camp_site') else ''
            ]))

            # Amenities
            amenities = {
                'drinking_water': tags.get('drinking_water') == 'yes',
                'toilets': tags.get('toilets') == 'yes',
                'shower': tags.get('shower') == 'yes',
                'fire_pit': tags.get('fire_pit') == 'yes' or tags.get('bbq') == 'yes',
                'electricity': tags.get('electricity') == 'yes',
                'internet_access': tags.get('internet_access') == 'yes' or tags.get('wifi') == 'yes',
                'picnic_table': tags.get('picnic_table') == 'yes',
                'waste_disposal': tags.get('waste_disposal') == 'yes',
            }
            amenities_list = [k for k, v in amenities.items() if v]

            # Land manager
            operator = tags.get('operator', '').lower()
            if 'forest service' in operator or 'usfs' in operator:
                land_manager = 'USFS'
            elif 'blm' in operator or 'bureau of land management' in operator:
                land_manager = 'BLM'
            elif 'national park service' in operator or 'nps' in operator:
                land_manager = 'NPS'
            elif operator:
                land_manager = tags.get('operator')
            else:
                land_manager = 'Unknown'

            access_notes = " | ".join(filter(None, [
                f"Access: {tags.get('access')}" if tags.get('access') else '',
                "4WD Only" if tags.get('4wd_only') == 'yes' else '',
                f"Surface: {tags.get('surface')}" if tags.get('surface') else ''
            ]))

            processed.append({
                'source': 'osm',
                'source_id': f'osm_{elem_type}_{elem_id}',
                'name': name,
                'lat': lat,
                'lon': lon,
                'description': description,
                'amenities': amenities_list,
                'land_manager': land_manager,
                'stay_limit': tags.get('stay:max') or tags.get('maxstay'),
                'access_notes': access_notes,
                'capacity': tags.get('capacity'),
                'fee': tags.get('fee', 'no'),
                'website': tags.get('website') or tags.get('url'),
                'camp_site_type': tags.get('camp_site'),
                'source_url': f'https://www.openstreetmap.org/{elem_type}/{elem_id}',
                'photo_urls': [],
                'attribution': '© OpenStreetMap contributors',
                'state': state_code,
                'raw': elem
            })

        return processed

    def collect(self, states: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """
        Collect OSM campsite data for given states or all US states.
        """
        if states is None:
            states = list(US_STATES.keys())

        all_results = []
        total_spots = 0

        for state_code in states:
            state_info = US_STATES.get(state_code)
            if not state_info:
                logger.warning(f"State code {state_code} not found in US_STATES. Skipping.")
                continue

            state_name = state_info['name']
            
            # Check checkpoint first
            checkpoint = self._load_checkpoint(state_code)
            if checkpoint:
                logger.info(f"Loaded {len(checkpoint)} results for {state_code} from checkpoint.")
                all_results.extend(checkpoint)
                total_spots += len(checkpoint)
                continue

            logger.info(f"Querying Overpass API for {state_name} ({state_code})...")
            
            query = self._build_query(state_name)
            
            # Rate limit
            self._rate_limit('overpass')

            try:
                # Custom retry logic for Overpass API
                response = self._retry_request(
                    method='POST',
                    url=OVERPASS_URL,
                    data={"data": query},
                )
                
                if not response:
                    logger.error(f"Failed to fetch data for {state_name}. Continuing...")
                    continue
                
                data = response.json()
                elements = data.get('elements', [])
                
                if not elements:
                    logger.warning(f"No elements found for {state_name}.")
                    continue
                
                processed_elements = self._process_elements(elements, state_code)
                
                logger.info(f"Found {len(processed_elements)} spots for {state_name}.")
                self._save_checkpoint(state_code, processed_elements)
                
                all_results.extend(processed_elements)
                total_spots += len(processed_elements)

            except Exception as e:
                logger.error(f"Error processing {state_name}: {str(e)}")
                # Overpass API limits might require wait
                time.sleep(60)

        # Save all raw results
        self._save_raw('osm_all_results', all_results)
        logger.info(f"Finished OSM collection. Total spots found: {total_spots}")
        
        return all_results

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    
    # Simple mock for testing without full pipeline context
    if 'US_STATES' not in globals() or not US_STATES:
        US_STATES = {
            'CO': {'name': 'Colorado', 'bbox': (36.99, -109.06, 41.0, -102.04)}
        }
        
    class MockBaseCollector:
        def __init__(self):
            self.last_call = 0
            
        def _rate_limit(self, key):
            now = time.time()
            elapsed = now - self.last_call
            limit = 30.0
            if elapsed < limit:
                time.sleep(limit - elapsed)
            self.last_call = time.time()
            
        def _retry_request(self, method, url, **kwargs):
            try:
                response = httpx.request(method, url, **kwargs)
                response.raise_for_status()
                return response
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 429:
                    logging.warning("Rate limited! Waiting 60s...")
                    time.sleep(60)
                raise e

        def _save_checkpoint(self, name, data):
            with open(f"{name}.json", 'w') as f:
                json.dump(data, f, indent=2)

        def _load_checkpoint(self, name):
            try:
                with open(f"{name}.json", 'r') as f:
                    return json.load(f)
            except FileNotFoundError:
                return None
                
        def _save_raw(self, name, data):
            with open(f"{name}.json", 'w') as f:
                json.dump(data, f, indent=2)
                
    # Overwrite the actual base collector for testing if needed
    try:
        from pipeline.collectors.base import BaseCollector
    except ImportError:
        BaseCollector = MockBaseCollector
        OSMCollector.__bases__ = (MockBaseCollector,)
        
    collector = OSMCollector()
    results = collector.collect(['CO'])
    print(f"Collected {len(results)} spots in Colorado")
