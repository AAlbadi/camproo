"""
RIDB (Recreation Information Database) collector for free camping facilities.
"""

import logging
import re
from typing import Any, Dict, List, Optional
import httpx

from pipeline.config import settings
try:
    from pipeline.config.states import US_STATES
except ImportError:
    US_STATES = ['CO']  # Fallback for testing

from pipeline.collectors.base import BaseCollector

logger = logging.getLogger(__name__)

class RIDBCollector(BaseCollector):
    """Collector for Recreation Information Database (RIDB)."""

    def __init__(self) -> None:
        super().__init__()
        self.base_url = settings.RIDB_BASE_URL.rstrip('/')
        self.api_key = settings.RIDB_API_KEY
        self.headers = {'apikey': self.api_key}

    def _strip_html(self, text: Optional[str]) -> str:
        """Strip HTML tags from text."""
        if not text:
            return ""
        return re.sub(r'<[^>]+>', '', text).strip()

    def _is_free_or_dispersed(self, facility: Dict[str, Any]) -> bool:
        """Determine if a facility is free or dispersed camping."""
        fee_desc = (facility.get('FacilityUseFeeDescription') or '').lower()
        desc = (facility.get('FacilityDescription') or '').lower()
        
        # Check fee description
        free_keywords = ['no fee', 'free', '$0', '0.00']
        if not fee_desc or any(kw in fee_desc for kw in free_keywords):
            return True
            
        # Check general description for primitive/dispersed indicators
        type_keywords = ['dispersed', 'primitive', 'backcountry']
        if any(kw in desc for kw in type_keywords):
            return True
            
        return False

    def _get_land_manager(self, org_id: str) -> str:
        """Derive land manager from OrgID."""
        org_id = str(org_id)
        managers = {
            '131': 'USFS',
            '126': 'BLM',
            '128': 'NPS',
            '129': 'USACE'
        }
        return managers.get(org_id, 'Other')

    def _fetch_media(self, facility_id: str) -> List[Dict[str, Any]]:
        """Fetch photos for a facility."""
        url = f"{self.base_url}/facilities/{facility_id}/media"
        photos = []
        try:
            self._rate_limit('ridb')
            response = self._retry_request('GET', url, params={'apikey': self.api_key})
            if response is None:
                return []
                
            data = response.json()
            for item in data.get('RECDATA', []):
                if item.get('MediaType') == 'Image':
                    photos.append({
                        'url': item.get('URL', ''),
                        'title': item.get('Title', ''),
                        'description': item.get('Description', ''),
                        'is_public_domain': True
                    })
        except Exception as e:
            logger.warning(f"Failed to fetch media for {facility_id}: {e}")
            
        return photos

    def collect(self, states: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """Collect free camping facilities from RIDB."""
        if not self.api_key or self.api_key.strip() in ("", "your_ridb_api_key_here"):
            logger.warning(
                "RIDB_API_KEY not provided or set to default template. "
                "Skipping RIDB collection. (Get a free key at https://ridb.recreation.gov/ and set in pipeline/.env)"
            )
            return []

        states_to_process = states if states is not None else US_STATES
        all_results = []
        
        for state in states_to_process:
            state = state.upper()
            checkpoint_key = f"ridb_{state}"
            
            # Check checkpoint first, skip if already collected
            cached_data = self._load_checkpoint(checkpoint_key)
            if cached_data is not None:
                logger.info(f"Loaded {len(cached_data)} facilities from checkpoint for {state}")
                all_results.extend(cached_data)
                continue
                
            logger.info(f"Fetching RIDB facilities for state: {state}")
            state_results = []
            offset = 0
            limit = 50
            total_found = 0
            
            while True:
                url = f"{self.base_url}/facilities"
                params = {
                    'apikey': self.api_key,
                    'FacilityTypeDescription': 'Camping',
                    'state': state,
                    'limit': limit,
                    'offset': offset
                }
                
                try:
                    self._rate_limit('ridb')
                    response = self._retry_request('GET', url, params=params)
                    if response is None:
                        break
                        
                    data = response.json()
                except httpx.HTTPStatusError as e:
                    if e.response.status_code == 403:
                        logger.error("API Key invalid or forbidden (403).")
                        break
                    elif e.response.status_code == 429:
                        logger.error("Rate limited (429).")
                        break
                    elif e.response.status_code >= 500:
                        logger.error(f"Server error: {e.response.status_code}")
                        break
                    else:
                        logger.error(f"HTTP error: {e}")
                        break
                except Exception as e:
                    logger.error(f"Request failed: {e}")
                    break
                    
                records = data.get('RECDATA', [])
                if not records:
                    break
                    
                total_found += len(records)
                    
                for facility in records:
                    if self._is_free_or_dispersed(facility):
                        fac_id = facility.get('FacilityID', '')
                        
                        photos = self._fetch_media(fac_id)
                        
                        parent_org = facility.get('PARENTORGID', '') or facility.get('OrgID', '')
                        
                        processed_fac = {
                            'source': 'ridb',
                            'source_id': fac_id,
                            'name': facility.get('FacilityName', ''),
                            'lat': facility.get('FacilityLatitude', 0.0),
                            'lon': facility.get('FacilityLongitude', 0.0),
                            'description': self._strip_html(facility.get('FacilityDescription', '')),
                            'fee_description': facility.get('FacilityUseFeeDescription', ''),
                            'stay_limit': facility.get('StayLimit', ''),
                            'directions': self._strip_html(facility.get('FacilityDirections', '')),
                            'phone': facility.get('FacilityPhone', ''),
                            'email': facility.get('FacilityEmail', ''),
                            'org_name': facility.get('OrgName', ''),
                            'land_manager': self._get_land_manager(parent_org),
                            'photo_urls': photos,
                            'source_url': f"https://www.recreation.gov/camping/campgrounds/{fac_id}",
                            'state': state,
                            'enabled': facility.get('Enabled', False),
                            'last_updated': facility.get('LastUpdatedDate', ''),
                            'raw': facility
                        }
                        state_results.append(processed_fac)
                        
                offset += limit
                
                if len(records) < limit:
                    break

            logger.info(f"Processing state {state}: found {total_found} camping facilities, {len(state_results)} free")
            
            # Save checkpoint per state
            self._save_checkpoint(checkpoint_key, state_results)
            all_results.extend(state_results)

        # Save all raw results
        if all_results:
            self._save_raw('ridb_all', all_results)
            
        return all_results

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    
    logger.info("Testing RIDB Collector on state: CO")
    collector = RIDBCollector()
    results = collector.collect(['CO'])
    logger.info(f"Total free facilities collected for CO: {len(results)}")
