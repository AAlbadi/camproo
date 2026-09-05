import { Spot } from '../types';

export interface MapBounds {
  northEast: { lat: number; lng: number };
  southWest: { lat: number; lng: number };
}

export interface RegionalHubCluster {
  id: string;
  name: string;
  count: number;
  coordinates: [number, number]; // [lat, lng]
  icon: string;
  description: string;
}

// Fast Haversine distance in miles between two coordinates
export function getDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return Math.round(3958.8 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

// Filter spots within a radial distance from center
export function filterSpotsByRadius(
  spots: Spot[],
  center: [number, number],
  radiusMiles: number
): Spot[] {
  const [cLat, cLng] = center;
  return spots.filter((spot) => {
    const dist = getDistanceMiles(cLat, cLng, spot.coordinates[0], spot.coordinates[1]);
    return dist <= radiusMiles;
  });
}

// Iconic US outdoor camping regions for macro-scale clustering (zoom < 7)
const REGION_BOUNDS = [
  {
    id: 'rockies',
    name: 'Colorado Rockies',
    icon: '⛰️',
    description: 'Alpine passes, national forests & high peaks',
    bounds: { minLat: 37.0, maxLat: 41.0, minLng: -109.0, maxLng: -102.0 }
  },
  {
    id: 'utah',
    name: 'Utah Red Rocks',
    icon: '🏜️',
    description: 'Moab, Zion & BLM canyonlands',
    bounds: { minLat: 36.9, maxLat: 42.0, minLng: -114.1, maxLng: -109.0 }
  },
  {
    id: 'pnw',
    name: 'Pacific Northwest',
    icon: '🌲',
    description: 'Cascades, Olympic rain forest & coast',
    bounds: { minLat: 42.0, maxLat: 49.0, minLng: -124.8, maxLng: -116.5 }
  },
  {
    id: 'california',
    name: 'Sierra & California',
    icon: '🏔️',
    description: 'Yosemite, Eastern Sierra & redwoods',
    bounds: { minLat: 32.5, maxLat: 42.0, minLng: -124.5, maxLng: -114.5 }
  },
  {
    id: 'southwest',
    name: 'Arizona Desert',
    icon: '🌵',
    description: 'Sedona red rocks & Sonoran desert',
    bounds: { minLat: 31.3, maxLat: 37.0, minLng: -114.8, maxLng: -109.0 }
  },
  {
    id: 'yellowstone',
    name: 'Tetons & N. Rockies',
    icon: '🏕️',
    description: 'Wyoming & Montana wilderness',
    bounds: { minLat: 42.0, maxLat: 49.0, minLng: -116.0, maxLng: -104.0 }
  },
  {
    id: 'blackhills',
    name: 'Black Hills & Badlands',
    icon: '🦬',
    description: 'Ponderosa pines & granite spires',
    bounds: { minLat: 42.5, maxLat: 46.0, minLng: -104.5, maxLng: -98.0 }
  },
  {
    id: 'appalachia',
    name: 'Blue Ridge & Smokies',
    icon: '🍂',
    description: 'Appalachian trail & lush ridges',
    bounds: { minLat: 34.5, maxLat: 39.5, minLng: -84.5, maxLng: -77.5 }
  },
  {
    id: 'greatlakes',
    name: 'Great Lakes Woods',
    icon: '🌊',
    description: 'Superior shoreline & boreal pine',
    bounds: { minLat: 43.0, maxLat: 49.0, minLng: -93.0, maxLng: -82.0 }
  },
  {
    id: 'ozarks',
    name: 'Ozarks & Ouachita',
    icon: '🛶',
    description: 'Crystal spring rivers & bluffs',
    bounds: { minLat: 34.0, maxLat: 38.5, minLng: -95.0, maxLng: -89.5 }
  },
  {
    id: 'southeast',
    name: 'Florida Springs & Coast',
    icon: '🌴',
    description: 'Crystal river basins & Ocala',
    bounds: { minLat: 25.0, maxLat: 31.0, minLng: -87.6, maxLng: -80.0 }
  }
];

// Compute regional clusters dynamically from spots
export function computeRegionalHubs(spots: Spot[]): RegionalHubCluster[] {
  if (spots.length === 0) return [];

  const hubs: RegionalHubCluster[] = [];

  for (const def of REGION_BOUNDS) {
    let count = 0;
    let sumLat = 0;
    let sumLng = 0;

    for (const spot of spots) {
      const lat = spot.coordinates[0];
      const lng = spot.coordinates[1];
      if (
        lat >= def.bounds.minLat &&
        lat <= def.bounds.maxLat &&
        lng >= def.bounds.minLng &&
        lng <= def.bounds.maxLng
      ) {
        count++;
        sumLat += lat;
        sumLng += lng;
      }
    }

    if (count > 0) {
      hubs.push({
        id: def.id,
        name: def.name,
        count,
        coordinates: [
          Math.round((sumLat / count) * 10000) / 10000,
          Math.round((sumLng / count) * 10000) / 10000
        ],
        icon: def.icon,
        description: def.description
      });
    }
  }

  // Sort by highest concentration
  return hubs.sort((a, b) => b.count - a.count);
}

// Smart Spatial Grid Sampler: caps visible markers at maxCount while distributing evenly across viewport
export function sampleSpotsEvenly(
  spots: Spot[],
  maxCount: number,
  bounds: MapBounds | null
): Spot[] {
  if (spots.length <= maxCount) return spots;
  if (!bounds) return spots.slice(0, maxCount);

  const gridRows = 5;
  const gridCols = 6;
  const minLat = Math.min(bounds.southWest.lat, bounds.northEast.lat);
  const maxLat = Math.max(bounds.southWest.lat, bounds.northEast.lat);
  const minLng = Math.min(bounds.southWest.lng, bounds.northEast.lng);
  const maxLng = Math.max(bounds.southWest.lng, bounds.northEast.lng);

  const latStep = (maxLat - minLat) / gridRows || 1;
  const lngStep = (maxLng - minLng) / gridCols || 1;

  const cells = new Map<string, Spot>();

  for (const s of spots) {
    const r = Math.min(gridRows - 1, Math.max(0, Math.floor((s.coordinates[0] - minLat) / latStep)));
    const c = Math.min(gridCols - 1, Math.max(0, Math.floor((s.coordinates[1] - minLng) / lngStep)));
    const key = `${r}_${c}`;

    const existing = cells.get(key);
    if (!existing || (s.rating || 0) > (existing.rating || 0)) {
      cells.set(key, s);
    }
  }

  const sampled = Array.from(cells.values());
  if (sampled.length < maxCount) {
    const sampledIds = new Set(sampled.map((s) => s.id));
    for (const s of spots) {
      if (!sampledIds.has(s.id)) {
        sampled.push(s);
        if (sampled.length >= maxCount) break;
      }
    }
  }

  return sampled.slice(0, maxCount);
}
