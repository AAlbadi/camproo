import type { Spot } from '../types';

export interface RouteOrigin {
  name: string;
  coordinates: [number, number]; // [lat, lng]
}

export interface RouteResult {
  coordinates: [number, number][]; // Array of [lat, lng]
  distanceMiles: number;
  durationMinutes: number;
  formattedDuration: string;
  fuelCostEstimate: number; // In USD based on ~10 MPG for RVs
  isSimulatedFallback: boolean;
  summary: string;
}

export const DEFAULT_ORIGINS: RouteOrigin[] = [
  { name: 'My RV (Denver, CO)', coordinates: [39.7392, -104.9903] },
  { name: 'Moab Hub, UT', coordinates: [38.5733, -109.5498] },
  { name: 'Salt Lake City, UT', coordinates: [40.7608, -111.8910] },
  { name: 'Bend, OR', coordinates: [44.0582, -121.3153] },
  { name: 'Austin, TX', coordinates: [30.2672, -97.7431] },
  { name: 'Phoenix, AZ', coordinates: [33.4484, -112.0740] },
  { name: 'Gatlinburg, TN', coordinates: [35.7143, -83.5102] },
];

/**
 * Calculates straight line distance (Haversine formula) in miles
 */
export function calculateHaversineDistanceMiles(
  [lat1, lon1]: [number, number],
  [lat2, lon2]: [number, number]
): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Formats duration in minutes to human readable string (e.g., "2h 45m" or "35m")
 */
export function formatDuration(minutes: number): string {
  const rounded = Math.round(minutes);
  if (rounded < 60) return `${rounded} min`;
  const hours = Math.floor(rounded / 60);
  const mins = rounded % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Generates intermediate bezier/curved coordinates for smooth fallback routes
 */
function generateCurvedFallbackRoute(
  start: [number, number],
  end: [number, number],
  numPoints: number = 25
): [number, number][] {
  const [lat1, lng1] = start;
  const [lat2, lng2] = end;

  // Generate a slight midpoint deflection to mimic natural highway curvature
  const midLat = (lat1 + lat2) / 2 + (lng2 - lng1) * 0.08;
  const midLng = (lng1 + lng2) / 2 - (lat2 - lat1) * 0.08;

  const points: [number, number][] = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    // Quadratic Bezier interpolation
    const lat = (1 - t) * (1 - t) * lat1 + 2 * (1 - t) * t * midLat + t * t * lat2;
    const lng = (1 - t) * (1 - t) * lng1 + 2 * (1 - t) * t * midLng + t * t * lng2;
    points.push([lat, lng]);
  }
  return points;
}

/**
 * Computes road route using OSRM driving service, with instant fallback
 */
export async function calculateRoute(
  origin: [number, number],
  destination: [number, number]
): Promise<RouteResult> {
  const [startLat, startLng] = origin;
  const [destLat, destLng] = destination;

  // OSRM expects: {lng},{lat};{lng},{lat}
  const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${destLng},${destLat}?overview=full&geometries=geojson&steps=false`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500); // 4.5s timeout

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const primaryRoute = data.routes[0];
        const rawCoords: [number, number][] = primaryRoute.geometry.coordinates; // [lng, lat]
        // Convert to Leaflet's [lat, lng] format
        const latLngCoords: [number, number][] = rawCoords.map(([lng, lat]) => [lat, lng]);

        const distanceMeters = primaryRoute.distance;
        const durationSecs = primaryRoute.duration;

        const distanceMiles = Math.round((distanceMeters / 1609.34) * 10) / 10;
        const durationMinutes = Math.round(durationSecs / 60);

        // Typical Class C/A RV fuel efficiency: ~10 MPG @ ~$3.65/gal
        const fuelCostEstimate = Math.round((distanceMiles / 10) * 3.65);

        return {
          coordinates: latLngCoords,
          distanceMiles,
          durationMinutes,
          formattedDuration: formatDuration(durationMinutes),
          fuelCostEstimate,
          isSimulatedFallback: false,
          summary: primaryRoute.legs?.[0]?.summary || 'Scenic Highway Route',
        };
      }
    }
  } catch (err) {
    console.warn('OSRM routing request failed or timed out, using high-accuracy fallback interpolation.', err);
  }

  // Fallback calculation
  const directDistMiles = calculateHaversineDistanceMiles(origin, destination);
  // Estimate real road distance (~1.22x factor due to winding roads/interstates)
  const estimatedRoadMiles = Math.round(directDistMiles * 1.22 * 10) / 10;
  // Estimate RV highway driving speed (~52 MPH average accounting for turns & elevation)
  const durationMinutes = Math.round((estimatedRoadMiles / 52) * 60);
  const fuelCostEstimate = Math.round((estimatedRoadMiles / 10) * 3.65);

  const fallbackCoords = generateCurvedFallbackRoute(origin, destination);

  return {
    coordinates: fallbackCoords,
    distanceMiles: estimatedRoadMiles,
    durationMinutes,
    formattedDuration: formatDuration(durationMinutes),
    fuelCostEstimate,
    isSimulatedFallback: true,
    summary: 'Direct Highway Corridor (Est.)',
  };
}

/**
 * Deep-link URL generators for Google Maps & Apple Maps navigation
 */
export function getGoogleMapsNavigationUrl(
  origin: [number, number],
  destination: [number, number],
  destinationTitle?: string
): string {
  const [startLat, startLng] = origin;
  const [destLat, destLng] = destination;
  const label = destinationTitle ? encodeURIComponent(destinationTitle) : '';
  return `https://www.google.com/maps/dir/?api=1&origin=${startLat},${startLng}&destination=${destLat},${destLng}&destination_place_id=${label}&travelmode=driving`;
}

export function getAppleMapsNavigationUrl(
  origin: [number, number],
  destination: [number, number]
): string {
  const [startLat, startLng] = origin;
  const [destLat, destLng] = destination;
  return `https://maps.apple.com/?saddr=${startLat},${startLng}&daddr=${destLat},${destLng}&dirflg=d`;
}

export interface CorridorSpotMatch {
  spot: Spot;
  distanceToRoute: number; // Miles off highway
  mileMarker: number;      // Mileage from start of trip
  progressRatio: number;   // 0.0 to 1.0 along the trip
  routeIntersectionCoords?: [number, number]; // [lat, lng] coordinates on the highway where detour begins
}

export interface CorridorSpotWithTiming extends CorridorSpotMatch {
  stopNumber: number;
  timeFromStartMinutes: number;
  formattedDriveDuration: string;
  arrivalTime: Date;
  formattedArrivalTime: string;
  isNearHighway: boolean;
}

export interface PopularRoadTripPreset {
  id: string;
  title: string;
  tagline: string;
  start: { name: string; coordinates: [number, number] };
  destination: { name: string; coordinates: [number, number] };
  corridorMiles: number;
  icon?: string;
}

export const POPULAR_ROAD_TRIP_PRESETS: PopularRoadTripPreset[] = [
  {
    id: 'denver-moab',
    title: 'Denver to Moab',
    tagline: 'I-70 Rockies to Red Rocks & Arches',
    start: { name: 'Denver, CO', coordinates: [39.7392, -104.9903] },
    destination: { name: 'Moab, UT', coordinates: [38.5733, -109.5498] },
    corridorMiles: 25,
    icon: '🏔️',
  },
  {
    id: 'seattle-olympic',
    title: 'Seattle to Olympic NP',
    tagline: 'Puget Sound to Rainforests & Pacific Coast',
    start: { name: 'Seattle, WA', coordinates: [47.6062, -122.3321] },
    destination: { name: 'Olympic National Park, WA', coordinates: [47.8021, -123.6044] },
    corridorMiles: 25,
    icon: '🌲',
  },
  {
    id: 'slc-zion',
    title: 'Salt Lake City to Zion NP',
    tagline: 'Wasatch Range to Red Rock Canyons',
    start: { name: 'Salt Lake City, UT', coordinates: [40.7608, -111.8910] },
    destination: { name: 'Zion National Park, UT', coordinates: [37.2982, -113.0263] },
    corridorMiles: 25,
    icon: '🏜️',
  },
  {
    id: 'phoenix-grandcanyon',
    title: 'Phoenix to Grand Canyon',
    tagline: 'Sonoran Desert through Sedona Red Rocks',
    start: { name: 'Phoenix, AZ', coordinates: [33.4484, -112.0740] },
    destination: { name: 'Grand Canyon South Rim, AZ', coordinates: [36.0544, -112.1401] },
    corridorMiles: 25,
    icon: '🦅',
  },
  {
    id: 'sf-laketahoe',
    title: 'San Francisco to Lake Tahoe',
    tagline: 'Bay Area through Sierra Nevada Pines',
    start: { name: 'San Francisco, CA', coordinates: [37.7749, -122.4194] },
    destination: { name: 'South Lake Tahoe, CA', coordinates: [38.9399, -119.9772] },
    corridorMiles: 25,
    icon: '🌊',
  },
  {
    id: 'vegas-valleyoffire',
    title: 'Las Vegas to Valley of Fire',
    tagline: 'Neon to Aztec Sandstone Wilderness',
    start: { name: 'Las Vegas, NV', coordinates: [36.1699, -115.1398] },
    destination: { name: 'Valley of Fire State Park, NV', coordinates: [36.4889, -114.5328] },
    corridorMiles: 20,
    icon: '🔥',
  },
];

/**
 * Formats a Date into a clean arrival string (e.g., "2:45 PM", "Tomorrow 8:15 AM", "Sun 1:20 PM")
 */
export function formatArrivalTime(arrivalTime: Date, referenceDate: Date = new Date()): string {
  const isSameDay =
    arrivalTime.getFullYear() === referenceDate.getFullYear() &&
    arrivalTime.getMonth() === referenceDate.getMonth() &&
    arrivalTime.getDate() === referenceDate.getDate();

  const tomorrow = new Date(referenceDate);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow =
    arrivalTime.getFullYear() === tomorrow.getFullYear() &&
    arrivalTime.getMonth() === tomorrow.getMonth() &&
    arrivalTime.getDate() === tomorrow.getDate();

  const timeString = arrivalTime.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  if (isSameDay) {
    return timeString;
  }
  if (isTomorrow) {
    return `Tomorrow ${timeString}`;
  }
  const dayName = arrivalTime.toLocaleDateString([], { weekday: 'short' });
  return `${dayName} ${timeString}`;
}

/**
 * High-speed corridor filter: finds all public parks and campsites along a driving route.
 * Samples the route polyline, applies a bounding box prefilter, and calculates mileage along the route.
 */
export function findSpotsAlongRoute(
  spots: Spot[],
  routeCoords: [number, number][],
  corridorMiles: number = 25
): CorridorSpotMatch[] {
  if (!routeCoords || routeCoords.length < 2 || spots.length === 0) return [];

  // 1. Calculate cumulative mileage along route vertices for milestone calculation
  const cumulativeMiles: number[] = [0];
  for (let i = 1; i < routeCoords.length; i++) {
    const segmentMiles = calculateHaversineDistanceMiles(routeCoords[i - 1], routeCoords[i]);
    cumulativeMiles.push(cumulativeMiles[i - 1] + segmentMiles);
  }
  const totalRouteMiles = cumulativeMiles[cumulativeMiles.length - 1];

  // 2. Downsample route to ~250 representative points for ultra-fast point-to-curve testing
  const sampleStep = Math.max(1, Math.floor(routeCoords.length / 250));
  const sampledIndices: number[] = [];
  for (let i = 0; i < routeCoords.length; i += sampleStep) {
    sampledIndices.push(i);
  }
  if (sampledIndices[sampledIndices.length - 1] !== routeCoords.length - 1) {
    sampledIndices.push(routeCoords.length - 1);
  }

  // 3. Compute route bounding box with corridor buffer
  let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
  for (const [lat, lng] of routeCoords) {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  }

  // 1 degree latitude is ~69 miles
  const latBuffer = corridorMiles / 68;
  const lngBuffer = corridorMiles / (69 * Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180) || 1);

  minLat -= latBuffer;
  maxLat += latBuffer;
  minLng -= lngBuffer;
  maxLng += lngBuffer;

  // 4. Candidate pre-filtering: eliminate 95%+ of nationwide spots in < 1ms
  const candidates = spots.filter((s) => {
    const [lat, lng] = s.coordinates;
    return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
  });

  // 5. Calculate closest distance and mile marker for each candidate
  const matches: CorridorSpotMatch[] = [];

  for (const spot of candidates) {
    let minDistance = Infinity;
    let closestSampleIdx = 0;

    for (const idx of sampledIndices) {
      const d = calculateHaversineDistanceMiles(spot.coordinates, routeCoords[idx]);
      if (d < minDistance) {
        minDistance = d;
        closestSampleIdx = idx;
      }
    }

    if (minDistance <= corridorMiles) {
      const mileMarker = Math.round(cumulativeMiles[closestSampleIdx] * 10) / 10;
      const progressRatio = totalRouteMiles > 0 ? mileMarker / totalRouteMiles : 0;
      matches.push({
        spot,
        distanceToRoute: Math.round(minDistance * 10) / 10,
        mileMarker,
        progressRatio,
        routeIntersectionCoords: routeCoords[closestSampleIdx],
      });
    }
  }

  // 6. Sort spots sequentially by mile marker from Start to Finish (first to end)
  matches.sort((a, b) => {
    if (a.mileMarker !== b.mileMarker) {
      return a.mileMarker - b.mileMarker;
    }
    // If at identical mile marker, prioritize the one closer to the road
    return a.distanceToRoute - b.distanceToRoute;
  });

  return matches;
}

/**
 * Finds the closest coordinate on a route polyline to a given target coordinate
 */
export function getClosestPointOnRoute(
  target: [number, number],
  routeCoords: [number, number][]
): [number, number] {
  if (!routeCoords || routeCoords.length === 0) return target;
  let minDist = Infinity;
  let closest: [number, number] = routeCoords[0];
  for (let i = 0; i < routeCoords.length; i++) {
    const d = calculateHaversineDistanceMiles(target, routeCoords[i]);
    if (d < minDist) {
      minDist = d;
      closest = routeCoords[i];
    }
  }
  return closest;
}

/**
 * Enriches sequential corridor spots with accurate arrival times and driving durations
 * calculated from the current departure time.
 */
export function enrichSpotsWithRouteTiming(
  matches: CorridorSpotMatch[],
  totalRouteMiles: number,
  totalDurationMinutes: number,
  departureTime: Date = new Date()
): CorridorSpotWithTiming[] {
  const avgHighwaySpeed =
    totalRouteMiles > 0 && totalDurationMinutes > 0
      ? totalRouteMiles / (totalDurationMinutes / 60)
      : 55;

  return matches.map((match, index) => {
    // Proportional highway drive time
    const highwayMinutes =
      totalRouteMiles > 0 && totalDurationMinutes > 0
        ? (match.mileMarker / totalRouteMiles) * totalDurationMinutes
        : (match.mileMarker / Math.max(avgHighwaySpeed, 35)) * 60;

    // Detour off highway drive time (~30 MPH average on access / scenic forest roads)
    const detourMinutes = (match.distanceToRoute / 30) * 60;
    const totalDriveMinutes = Math.max(1, Math.round(highwayMinutes + detourMinutes));

    const arrivalTime = new Date(departureTime.getTime() + totalDriveMinutes * 60 * 1000);
    const formattedArrivalTime = formatArrivalTime(arrivalTime, departureTime);

    return {
      ...match,
      stopNumber: index + 1,
      timeFromStartMinutes: totalDriveMinutes,
      formattedDriveDuration: formatDuration(totalDriveMinutes),
      arrivalTime,
      formattedArrivalTime,
      isNearHighway: match.distanceToRoute <= 2.5,
    };
  });
}
