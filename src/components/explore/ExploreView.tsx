import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { SpotCard } from './SpotCard';
import { FilterPanel } from './FilterPanel';
import { InteractiveMap, MapBounds } from './InteractiveMap';
import { UberRouteDrawer } from './UberRouteDrawer';
import { CategoryBar } from '../common/CategoryBar';
import { Spot } from '../../types';
import { RouteOrigin, RouteResult, DEFAULT_ORIGINS, calculateRoute, getGoogleMapsNavigationUrl, findSpotsAlongRoute, enrichSpotsWithRouteTiming, formatArrivalTime, formatDuration } from '../../lib/routeService';
import { getOptimizedImageUrl, getRawImageUrl, FALLBACK_CAMPING_PHOTO } from '../../lib/imageOptimizer';
import { isSpotMatchingQuery, US_STATES, findCampingArea } from '../../lib/areaSearchService';
import { AreaSelectPayload } from './MapSearchBar';

export function cleanSpotTitle(title: string | undefined | null): string {
  if (!title) return 'Scenic Campsite';
  return title
    .replace(/\bCamground\b/gi, 'Campground')
    .replace(/\bCamprgound\b/gi, 'Campground')
    .trim();
}
import {
  X,
  Navigation,
  Loader2,
  Maximize2,
  Minimize2,
  LayoutGrid,
  ChevronDown,
  MapPin,
  Sparkles,
  Car,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Star,
  ArrowRight,
  ExternalLink,
  Milestone,
  Compass,
  Clock,
  Flag,
  Check,
  List,
} from 'lucide-react';

export type MapSizeMode = 'split' | 'full';

export const POPULAR_REGIONS = [
  { name: 'Colorado Rockies', emoji: '🏔️', center: [39.55, -106.0] as [number, number], zoom: 8 },
  { name: 'Sedona & Coconino', emoji: '🏜️', center: [34.87, -111.76] as [number, number], zoom: 9 },
  { name: 'Moab & Arches', emoji: '🏜️', center: [38.57, -109.55] as [number, number], zoom: 9 },
  { name: 'Oregon Cascades', emoji: '🌲', center: [44.05, -121.31] as [number, number], zoom: 8 },
  { name: 'Sawtooths, ID', emoji: '🌲', center: [44.22, -114.93] as [number, number], zoom: 8 },
  { name: 'California Sierras', emoji: '⛰️', center: [37.86, -119.53] as [number, number], zoom: 8 },
];

interface ExploreViewProps {
  onRequestStay: (spot: Spot) => void;
}

export const ExploreView: React.FC<ExploreViewProps> = ({ onRequestStay }) => {
  const {
    spots,
    users,
    searchFilters,
    setSearchFilters,
    setSelectedSpotId,
    setCurrentView,
    resetFilters,
    userLocation,
    sortByDistance,
    setSortByDistance,
    isLocating,
    handleNearMe,
    targetView,
    setTargetView,
  } = useApp();

  // Map view toggle: standard view (spots list) or Full Screen Map
  const [isMapExpanded, setIsMapExpanded] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 768 : true;
  });

  // Full Screen Mode: Side-by-side Listing & Mobile Sheet
  const [showSideListingOnFull, setShowSideListingOnFull] = useState<boolean>(true);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState<boolean>(false);
  const [mobileListMode, setMobileListMode] = useState<'card' | 'compact'>('card');
  const sideListingScrollRef = useRef<HTMLDivElement>(null);
  const floatingRowRef = useRef<HTMLDivElement>(null);
  const [hoveredSpotId, setHoveredSpotId] = useState<string | null>(null);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const boundsDebounceRef = useRef<any>(null);

  // Progressive Lazy Loading for Sidebar (loads in batches of 20)
  const [visibleSidebarCount, setVisibleSidebarCount] = useState<number>(20);

  // Debounced bounds update: prevents re-calculating thousands of spots on every micro-movement
  const handleBoundsChange = useCallback((newBounds: MapBounds) => {
    if (boundsDebounceRef.current) {
      clearTimeout(boundsDebounceRef.current);
    }
    boundsDebounceRef.current = setTimeout(() => {
      setMapBounds(newBounds);
    }, 150);
  }, []);

  // Jump to US Havens (Centers map on high-density Colorado / Central US)
  const handleJumpToUSHavens = useCallback(() => {
    setTargetView({
      center: [39.55, -105.8],
      zoom: 7,
      timestamp: Date.now(),
    });
  }, [setTargetView]);

  // Jump to specific popular camping region
  const handleJumpToRegion = useCallback((region: (typeof POPULAR_REGIONS)[0]) => {
    setTargetView({
      center: region.center,
      zoom: region.zoom,
      timestamp: Date.now(),
    });
  }, [setTargetView]);

  // Smoothly toggle sidebar and notify map to resize its viewport
  const handleToggleSideListing = useCallback((show: boolean) => {
    setShowSideListingOnFull(show);
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 150);
  }, []);

  // Uber Routing State
  const [origin, setOrigin] = useState<RouteOrigin>(DEFAULT_ORIGINS[0]);
  const [routedSpot, setRoutedSpot] = useState<Spot | null>(null);
  const [activeRoute, setActiveRoute] = useState<RouteResult | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [isSimulatingDrive, setIsSimulatingDrive] = useState(false);

  // Active Exploration Radius (default null = nationwide all spots, or 25, 50, 100, 250 when filtered)
  const [selectedRadiusMiles, setSelectedRadiusMiles] = useState<number | null>(null);

  // Road Trip corridor sub-filter: 'all' | 'near-highway' | 'big-rig'
  const [routeFilter, setRouteFilter] = useState<'all' | 'near-highway' | 'big-rig'>('all');

  // Live departure time (refreshed every minute for real-time ETAs if user leaves now)
  const [departureTime, setDepartureTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setDepartureTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Quick switch corridor width
  const handleUpdateCorridor = useCallback((miles: number) => {
    setSearchFilters((prev) => {
      if (!prev.tripRoute) return prev;
      return {
        ...prev,
        tripRoute: {
          ...prev.tripRoute,
          corridorMiles: miles,
        },
      };
    });
  }, [setSearchFilters]);

  // Final destination estimated arrival time
  const finalDestinationETA = useMemo(() => {
    if (!searchFilters.tripRoute) return null;
    const durMins = searchFilters.tripRoute.durationMinutes || 0;
    const arr = new Date(departureTime.getTime() + durMins * 60 * 1000);
    return formatArrivalTime(arr, departureTime);
  }, [searchFilters.tripRoute, departureTime]);

  // Airbnb pagination: 24 cards initial for instant rendering
  const [visibleCount, setVisibleCount] = useState(24);

  // Sync route origin when user location becomes available
  useEffect(() => {
    if (userLocation) {
      const newOrigin: RouteOrigin = {
        name: 'My Live GPS Location',
        coordinates: [userLocation.lat, userLocation.lng],
      };
      setOrigin(newOrigin);
    }
  }, [userLocation]);

  const handleSelectArea = useCallback((payload: AreaSelectPayload) => {
    setIsMapExpanded(true);
    setSearchFilters(prev => ({
      ...prev,
      locationQuery: payload.title,
      stateCode: payload.stateAbbr || 'all',
      searchCenter: payload.center,
      searchRadiusMiles: payload.radiusMiles || 50,
    }));

    if (payload.bbox) {
      setTargetView({
        bounds: {
          southWest: { lat: payload.bbox[0], lng: payload.bbox[1] },
          northEast: { lat: payload.bbox[2], lng: payload.bbox[3] },
        },
        timestamp: Date.now(),
      });
    } else if (payload.center) {
      setTargetView({
        center: payload.center,
        zoom: payload.zoom || 10,
        timestamp: Date.now(),
      });
    }
  }, [setSearchFilters, setTargetView]);

  // Auto-expand map when user searches a destination/city so they see the map fly there and display spots
  useEffect(() => {
    if (targetView && (searchFilters.locationQuery || searchFilters.searchCenter || sortByDistance)) {
      setIsMapExpanded(true);
      window.dispatchEvent(new Event('resize'));
    }
  }, [targetView, searchFilters.locationQuery, searchFilters.searchCenter, sortByDistance]);

  const handleClearSearch = useCallback(() => {
    setSearchFilters(prev => ({
      ...prev,
      locationQuery: '',
      stateCode: 'all',
      searchCenter: undefined,
      searchRadiusMiles: undefined,
    }));
    setTargetView({
      center: [39.5, -98.35],
      zoom: 5,
      timestamp: Date.now(),
    });
  }, [setSearchFilters, setTargetView]);

  // Reset pagination when search, filters, radius, or bounds change
  useEffect(() => {
    setVisibleCount(24);
    setVisibleSidebarCount(20);
  }, [searchFilters, sortByDistance, selectedRadiusMiles, mapBounds]);

  // Active filter count (only counting genuine useful filters)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchFilters.locationQuery) count++;
    if (searchFilters.stateCode && searchFilters.stateCode !== 'all') count++;
    if (searchFilters.landManager && searchFilters.landManager !== 'all') count++;
    if (searchFilters.bathroomRequired) count++;
    if (searchFilters.waterRequired) count++;
    if (searchFilters.firePitRequired) count++;
    if (searchFilters.trashRequired) count++;
    if (searchFilters.featuredOnly) count++;
    if (searchFilters.environments.length > 0) count += searchFilters.environments.length;
    return count;
  }, [searchFilters]);

  // Fast distance helper (Haversine formula in miles)
  const getDistanceMiles = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    return Math.round(3958.8 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
  }, []);

  // Filter spots by user search criteria with authentic data fields
  const filteredSpots = useMemo(() => {
    const query = searchFilters.locationQuery.trim();
    const stateCode = searchFilters.stateCode;
    const searchCenter = searchFilters.searchCenter;
    const searchRadiusMiles = searchFilters.searchRadiusMiles || 60;
    const landManager = searchFilters.landManager;
    const bathroom = searchFilters.bathroomRequired;
    const water = searchFilters.waterRequired;
    const firePit = searchFilters.firePitRequired;
    const trash = searchFilters.trashRequired;
    const featuredOnly = searchFilters.featuredOnly;
    const envs = searchFilters.environments;
    const checkEnvs = envs.length > 0;

    // Filter spots by agency, amenities, environment
    const candidateSpots = spots.filter(spot => {
      // Public land agency filter (USFS vs BLM)
      if (landManager && landManager !== 'all') {
        const spotManager = (spot as any)._pipeline?.land_manager || (spot as any).landManager;
        if (spotManager !== landManager) return false;
      }

      // Verified Amenities from data
      if (bathroom && !spot.amenities.bathroom) return false;
      if (water && (!spot.amenities.water || spot.amenities.water === 'none')) return false;
      if (firePit && !spot.amenities.firePit) return false;
      if (trash && !spot.amenities.trash) return false;

      // Featured / Handpicked Havens
      if (featuredOnly && !spot.isFeatured) return false;

      // Landscape Environment
      if (checkEnvs && !envs.includes(spot.environment)) return false;

      return true;
    });

    let list: Spot[] = [];

    // 0. Road Trip Corridor Search (Parks & havens along the driving route in sequential order)
    if (
      searchFilters.tripRoute &&
      searchFilters.tripRoute.routeCoordinates &&
      searchFilters.tripRoute.routeCoordinates.length > 1
    ) {
      const corridor = searchFilters.tripRoute.corridorMiles || 25;
      const rawAlong = findSpotsAlongRoute(candidateSpots, searchFilters.tripRoute.routeCoordinates, corridor);
      const dist = searchFilters.tripRoute.distanceMiles || 0;
      const dur = searchFilters.tripRoute.durationMinutes || 0;
      const enriched = enrichSpotsWithRouteTiming(rawAlong, dist, dur, departureTime);

      let result = enriched.map(
        (item) =>
          ({
            ...item.spot,
            distanceMiles: item.distanceToRoute,
            distanceToRoute: item.distanceToRoute,
            mileMarker: item.mileMarker,
            routeStopIndex: item.stopNumber,
            timeFromStartMinutes: item.timeFromStartMinutes,
            formattedDriveDuration: item.formattedDriveDuration,
            arrivalTime: item.arrivalTime,
            arrivalTimeFormatted: item.formattedArrivalTime,
            isNearHighway: item.isNearHighway,
            routeIntersectionCoords: item.routeIntersectionCoords,
          } as any)
      );

      if (routeFilter === 'near-highway') {
        result = result.filter((s: any) => (s.distanceToRoute ?? s.distanceMiles ?? 99) <= 3);
      } else if (routeFilter === 'big-rig') {
        result = result.filter((s) => (s.rigCompatibility?.maxLengthFt || 0) >= 35);
      }

      return result;
    }

    // Check if query matches a known camping destination / city
    const matchedArea = !searchCenter && query ? findCampingArea(query) : null;
    const effectiveCenter = searchCenter || (matchedArea ? matchedArea.center : null);
    const effectiveRadius = searchCenter ? searchRadiusMiles : (matchedArea?.radiusMiles || 60);

    if (effectiveCenter && effectiveCenter.length === 2) {
      // Geographic proximity search (e.g. searched "Seattle" or "Moab")
      const withDistance = candidateSpots.map(spot => ({
        spot,
        dist: getDistanceMiles(effectiveCenter![0], effectiveCenter![1], spot.coordinates[0], spot.coordinates[1])
      }));

      // Sort by distance ascending: closest first
      withDistance.sort((a, b) => a.dist - b.dist);

      // Check how many are within the initial radius
      const initialMatches = withDistance.filter(item => item.dist <= effectiveRadius);

      // If initial radius has at least 10 spots, use them.
      let selectedMatches = initialMatches;
      if (initialMatches.length < 10) {
        const expandedMatches = withDistance.filter(item => item.dist <= Math.max(effectiveRadius, 160));
        selectedMatches = expandedMatches.length >= 10 ? expandedMatches : withDistance.slice(0, 20);
      }

      list = selectedMatches.map(item => ({
        ...item.spot,
        distanceMiles: item.dist
      }) as any);
    } else {
      // Standard query or state matching
      list = candidateSpots.filter(spot => 
        isSpotMatchingQuery(spot, query, stateCode)
      );

      // Distance sorting if user explicitly toggled "Near Me"
      if (userLocation && sortByDistance) {
        list = list.map(spot => ({
          ...spot,
          distanceMiles: getDistanceMiles(userLocation.lat, userLocation.lng, spot.coordinates[0], spot.coordinates[1])
        }) as any);
        list.sort((a, b) => ((a as any).distanceMiles ?? 99999) - ((b as any).distanceMiles ?? 99999));
      }
    }

    // Active Exploration Radius Filter (centered at current origin)
    if (selectedRadiusMiles !== null && selectedRadiusMiles > 0) {
      list = list.filter((spot) => {
        const dist = getDistanceMiles(origin.coordinates[0], origin.coordinates[1], spot.coordinates[0], spot.coordinates[1]);
        return dist <= selectedRadiusMiles;
      });
    }

    return list;
  }, [spots, searchFilters, userLocation, sortByDistance, getDistanceMiles, selectedRadiusMiles, origin, departureTime, routeFilter]);

  // Spots bounded by map viewport
  const spotsInMapBounds = useMemo(() => {
    if (!mapBounds) return filteredSpots;
    const minLat = Math.min(mapBounds.southWest.lat, mapBounds.northEast.lat);
    const maxLat = Math.max(mapBounds.southWest.lat, mapBounds.northEast.lat);
    const minLng = Math.min(mapBounds.southWest.lng, mapBounds.northEast.lng);
    const maxLng = Math.max(mapBounds.southWest.lng, mapBounds.northEast.lng);

    return filteredSpots.filter(spot => {
      const lat = spot.coordinates[0];
      const lng = spot.coordinates[1];
      return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
    });
  }, [filteredSpots, mapBounds]);

  // Automatically recalculate route when origin or routedSpot changes
  const triggerRouteCalculation = useCallback(async (spot: Spot, currentOrigin: RouteOrigin) => {
    setRoutedSpot(spot);
    setIsLoadingRoute(true);
    setIsSimulatingDrive(false);
    try {
      const routeRes = await calculateRoute(currentOrigin.coordinates, spot.coordinates);
      setActiveRoute(routeRes);
    } catch (err) {
      console.error('Failed to calculate route', err);
    } finally {
      setIsLoadingRoute(false);
    }
  }, []);

  const handleSpotMapSelect = (spot: Spot) => {
    if (searchFilters.tripRoute) {
      // In road trip mode: do NOT overwrite the Start-to-End highway route!
      // Simply select the spot so it is focused on the map and drawer opens!
      setRoutedSpot(spot);
      if (window.innerWidth < 768) {
        setShowSideListingOnFull(false);
        setIsMobileSheetOpen(false);
      }
      return;
    }
    triggerRouteCalculation(spot, origin);
    // On mobile devices, close mobile bottom sheet so map and preview card are visible
    if (window.innerWidth < 768) {
      setShowSideListingOnFull(false);
      setIsMobileSheetOpen(false);
    }
  };

  const handleChangeOrigin = (newOrigin: RouteOrigin) => {
    setOrigin(newOrigin);
    if (routedSpot && !searchFilters.tripRoute) {
      triggerRouteCalculation(routedSpot, newOrigin);
    }
  };

  const handleClearRoute = () => {
    setRoutedSpot(null);
    if (!searchFilters.tripRoute) {
      setActiveRoute(null);
    }
    setIsSimulatingDrive(false);
    if (isMapExpanded && !showSideListingOnFull) {
      setShowSideListingOnFull(true);
    }
  };

  // Sync activeRoute from searchFilters.tripRoute
  useEffect(() => {
    if (
      searchFilters.tripRoute &&
      searchFilters.tripRoute.routeCoordinates &&
      searchFilters.tripRoute.routeCoordinates.length > 1
    ) {
      setIsMapExpanded(true);
      const dist = searchFilters.tripRoute.distanceMiles || 0;
      const durMins = searchFilters.tripRoute.durationMinutes || 0;
      const durFmt = searchFilters.tripRoute.formattedDuration || '0 min';
      setActiveRoute({
        coordinates: searchFilters.tripRoute.routeCoordinates,
        distanceMiles: dist,
        durationMinutes: durMins,
        formattedDuration: durFmt,
        fuelCostEstimate: Math.round((dist / 10) * 3.85),
        isSimulatedFallback: false,
        summary: `Scenic Route: ${searchFilters.tripRoute.origin.title} → ${searchFilters.tripRoute.destination.title}`,
      });
      setOrigin({
        name: searchFilters.tripRoute.origin.title,
        coordinates: searchFilters.tripRoute.origin.coordinates,
      });
      setRoutedSpot(null);
    } else if (!routedSpot) {
      setActiveRoute(null);
    }
  }, [searchFilters.tripRoute]);

  const handleNavigateToDetails = (spotId: string) => {
    setSelectedSpotId(spotId);
    setCurrentView('spot-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Helper to format clean location without repeating spot title
  const getSpotDisplayLocation = useCallback((spot: Spot) => {
    const titleClean = spot.title.trim().toLowerCase();
    const locClean = (spot.locationName || '').trim().toLowerCase();
    const agencyClean = locClean.replace(/^(usfs|blm|state park|nps|usda|coe)\s*/i, '').trim();
    if (locClean === titleClean || agencyClean === titleClean || !spot.locationName) {
      return spot.generalArea || 'Public Land';
    }
    return spot.locationName;
  }, []);

  // When in map view, strictly display the spots visible on the map
  const displayedSpots = useMemo(() => {
    let list: Spot[];
    if (searchFilters.tripRoute) {
      // In road trip mode, show all havens along the route in mile marker order
      list = [...filteredSpots];
    } else if (!isMapExpanded) {
      // In standard grid view, show all filtered spots (never clip by hidden map bounds)
      list = [...filteredSpots];
    } else if (mapBounds) {
      // Map view with active bounds: strictly show the spots in this viewport
      list = [...spotsInMapBounds];
    } else {
      list = [...filteredSpots];
    }

    if (routedSpot) {
      const idx = list.findIndex(s => s.id === routedSpot.id);
      if (idx > 0) {
        const [selected] = list.splice(idx, 1);
        list.unshift(selected);
      } else if (idx === -1) {
        list.unshift(routedSpot);
      }
    }
    return list;
  }, [isMapExpanded, mapBounds, spotsInMapBounds, filteredSpots, routedSpot, searchFilters.tripRoute]);

  // Handle infinite scroll loading when user scrolls near the bottom of the sidebar
  const handleSidebarScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 250) {
      setVisibleSidebarCount((prev) => Math.min(prev + 20, displayedSpots.length));
    }
  }, [displayedSpots.length]);

  // Active search title (city, area, or state)
  const activeSearchTitle = useMemo(() => {
    if (searchFilters.locationQuery) return searchFilters.locationQuery;
    if (searchFilters.stateCode && searchFilters.stateCode !== 'all') {
      return US_STATES[searchFilters.stateCode]?.name || searchFilters.stateCode;
    }
    return '';
  }, [searchFilters.locationQuery, searchFilters.stateCode]);

  // Other spots in view (excluding currently selected spot on top, unless in road trip mode where order is preserved)
  const otherSpots = useMemo(() => {
    if (!routedSpot) return displayedSpots;
    if (searchFilters.tripRoute) return displayedSpots;
    return displayedSpots.filter((s) => s.id !== routedSpot.id);
  }, [displayedSpots, routedSpot, searchFilters.tripRoute]);

  // Smoothly scroll the side listing and floating row to the selected spot at index 0
  useEffect(() => {
    if (routedSpot) {
      if (sideListingScrollRef.current) {
        sideListingScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
      if (floatingRowRef.current) {
        floatingRowRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      }
    }
  }, [routedSpot]);

  const paginatedSpots = useMemo(() => displayedSpots.slice(0, visibleCount), [displayedSpots, visibleCount]);

  return (
    <div className={`min-h-screen ${isMapExpanded ? 'pb-0' : 'pb-20'}`}>
      {/* Category Bar Header (Desktop only - mobile opens straight into edge-to-edge minimalist map) */}
      <div className="hidden md:block">
        <CategoryBar
          onOpenFilters={() => setShowFiltersModal(true)}
          activeFilterCount={activeFilterCount}
        />
      </div>

      <div className={`w-full ${isMapExpanded ? 'px-0 pt-0' : 'max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-2.5 sm:pt-4'}`}>
        {/* Active Proximity / Nearest Spots Header (Only when in grid view) */}
        {!isMapExpanded && activeSearchTitle && (
          <div className="bg-white/95 dark:bg-dark-900/95 backdrop-blur-xl border border-dark-200/90 dark:border-dark-800 rounded-3xl p-3.5 sm:p-4 mb-4 mx-4 sm:mx-0 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3.5 animate-fade-in">
            {/* Left: Location & Match Info */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-forest-50 dark:bg-forest-950/60 border border-forest-200/70 text-forest-700 dark:text-forest-400 flex items-center justify-center shrink-0 shadow-2xs">
                <Compass className="w-5 h-5 animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-black text-dark-950 dark:text-white tracking-tight truncate">
                    Nearest Camping Spots to{' '}
                    <span className="text-forest-700 dark:text-forest-400 underline decoration-forest-400/40 underline-offset-2">
                      {activeSearchTitle}
                    </span>
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-forest-100/80 dark:bg-forest-900/50 text-forest-800 dark:text-forest-300 text-[11px] font-black border border-forest-200/80 shadow-2xs shrink-0">
                    {filteredSpots.length.toLocaleString()} camps found
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-dark-500 font-semibold mt-0.5">
                  <span className="flex items-center gap-1 text-blue-700 dark:text-blue-400 font-bold">
                    <Navigation className="w-3 h-3 fill-current" />
                    <span>Sorted closest first</span>
                  </span>
                  <span>·</span>
                  <span>Within {searchFilters.searchRadiusMiles || 60} miles</span>
                </div>
              </div>
            </div>

            {/* Right: Quick Radius Selector & Clear Action */}
            <div className="flex flex-wrap items-center gap-2 self-end md:self-auto shrink-0">
              {/* Quick Radius Selector */}
              <div className="flex items-center gap-1 bg-dark-50 dark:bg-dark-800/60 p-1 rounded-2xl border border-dark-200/60 dark:border-dark-700/60 text-xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-dark-400 pl-2 pr-0.5">
                  Radius:
                </span>
                {[25, 50, 60, 100, 150].map((r) => {
                  const isActive = (searchFilters.searchRadiusMiles || 60) === r;
                  return (
                    <button
                      key={r}
                      onClick={() =>
                        setSearchFilters((prev) => ({
                          ...prev,
                          searchRadiusMiles: r,
                        }))
                      }
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                        isActive
                          ? 'bg-dark-900 text-white shadow-2xs dark:bg-white dark:text-dark-950'
                          : 'text-dark-600 hover:text-dark-950 hover:bg-white/80 dark:text-dark-300 dark:hover:bg-dark-700'
                      }`}
                    >
                      {r}mi
                    </button>
                  );
                })}
              </div>

              {/* Clear Search Pill */}
              <button
                onClick={handleClearSearch}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-dark-100 hover:bg-dark-200/90 text-dark-700 dark:bg-dark-800 dark:hover:bg-dark-700 dark:text-dark-300 text-xs font-bold border border-dark-200/70 dark:border-dark-700/70 shadow-2xs transition-all active:scale-95 cursor-pointer"
                title="Clear current area search"
              >
                <X className="w-3.5 h-3.5 text-dark-500 dark:text-dark-400" />
                <span>Clear Search</span>
              </button>
            </div>
          </div>
        )}

        {/* Minimalist Top Control Bar (Only when in Standard Grid View) */}
        {!isMapExpanded && (
          <div className="hidden md:flex items-center justify-between gap-3 mb-4 pb-2 border-b border-dark-200">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black text-dark-900 tracking-tight">
                {filteredSpots.length.toLocaleString()} Free RV Havens
              </span>

              {/* If Near Me / Distance sort is active, show the distance status & radius options */}
              {userLocation && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleNearMe}
                    disabled={isLocating}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black transition-all border shadow-xs ${
                      sortByDistance
                        ? 'bg-blue-600 text-white border-blue-700 shadow-blue-500/20 hover:bg-blue-700'
                        : 'bg-blue-50/80 hover:bg-blue-100 text-blue-800 border-blue-200/80 hover:border-blue-300'
                    }`}
                    title="Toggle distance sorting"
                  >
                    <Navigation className={`w-3.5 h-3.5 ${sortByDistance ? 'fill-current' : 'text-blue-600'}`} />
                    <span>{sortByDistance ? '📍 Sorted: Closest to Me' : '📍 Distance Sorting Off'}</span>
                  </button>

                  {/* Smart Radius Selector */}
                  <div className="flex items-center gap-1 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-dark-200 shadow-xs text-xs">
                    <span className="text-[10px] font-black text-dark-500 pl-1 pr-0.5 uppercase tracking-wider">
                      Radius:
                    </span>
                    {[25, 50, 100, 250].map((r) => (
                      <button
                        key={r}
                        onClick={() => setSelectedRadiusMiles(selectedRadiusMiles === r ? null : r)}
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-black transition-all ${
                          selectedRadiusMiles === r
                            ? 'bg-roo-500 text-white shadow-xs'
                            : 'text-dark-700 hover:text-dark-950 hover:bg-dark-100'
                        }`}
                      >
                        {r}mi
                      </button>
                    ))}
                    <button
                      onClick={() => setSelectedRadiusMiles(null)}
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-black transition-all ${
                        selectedRadiusMiles === null
                          ? 'bg-dark-900 text-white shadow-xs'
                          : 'text-dark-700 hover:text-dark-950 hover:bg-dark-100'
                      }`}
                    >
                      All
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Clean View Toggle: Standard List vs Full Map Only */}
            <div className="liquid-glass p-1 rounded-full border border-dark-200 flex items-center gap-1 shadow-xs">
              <button
                onClick={() => {
                  setIsMapExpanded(false);
                  window.dispatchEvent(new Event('resize'));
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                  !isMapExpanded ? 'bg-dark-900 text-white shadow-xs' : 'text-dark-700 hover:text-dark-950 hover:bg-white/50'
                }`}
                title="Standard Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Spots List</span>
              </button>
              <button
                onClick={() => {
                  setIsMapExpanded(true);
                  window.dispatchEvent(new Event('resize'));
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                  isMapExpanded ? 'bg-dark-900 text-white shadow-xs' : 'text-dark-700 hover:text-dark-950 hover:bg-white/50'
                }`}
                title="Full Map View with Side Listing"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Full Map</span>
              </button>
            </div>
          </div>
        )}

        {/* Road Trip Route Active Banner (shown in Standard Grid View only) */}
        {/* Road Trip Route Active Banner (shown in Standard Grid View only) */}
        {!isMapExpanded && searchFilters.tripRoute && (
          <div className="liquid-glass bg-white/95 rounded-2xl sm:rounded-3xl p-3 sm:p-5 border border-roo-200/90 shadow-[0_8px_30px_rgba(255,90,31,0.08)] flex flex-col gap-2.5 sm:gap-3.5 animate-fade-in mb-3 sm:mb-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-roo-500 to-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Milestone className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <span className="text-[9px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                      START
                    </span>
                    <span className="text-xs sm:text-base font-black text-dark-950 truncate max-w-[120px] sm:max-w-none">
                      {searchFilters.tripRoute.origin.title}
                    </span>
                    <span className="text-roo-500 font-black text-xs sm:text-sm">➔</span>
                    <span className="text-[9px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded-md bg-dark-900 text-white">
                      FINISH
                    </span>
                    <span className="text-xs sm:text-base font-black text-dark-950 truncate max-w-[120px] sm:max-w-none">
                      {searchFilters.tripRoute.destination.title}
                    </span>
                  </div>
                  <div className="text-[11px] sm:text-xs text-dark-600 font-medium flex items-center gap-1.5 sm:gap-2 mt-1 flex-wrap">
                    <span className="font-extrabold text-emerald-700 bg-emerald-50 px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded-full border border-emerald-200/60 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-emerald-600" />
                      <span>Leave: Now</span>
                    </span>
                    <span className="font-extrabold text-dark-800">
                      🛣️ {searchFilters.tripRoute.distanceMiles} mi ({searchFilters.tripRoute.formattedDuration})
                    </span>
                    {finalDestinationETA && (
                      <>
                        <span>·</span>
                        <span className="font-extrabold text-indigo-700 bg-indigo-50 px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded-full border border-indigo-200/60 flex items-center gap-1">
                          <Flag className="w-3 h-3 text-indigo-600" />
                          <span>Arrival ~{finalDestinationETA}</span>
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto justify-end shrink-0">
                <button
                  onClick={() => {
                    setIsMapExpanded(true);
                    window.dispatchEvent(new Event('resize'));
                  }}
                  className="flex-1 sm:flex-initial px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl bg-dark-900 hover:bg-black text-white text-xs font-black shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Route Map</span>
                </button>
                <button
                  onClick={() => setSearchFilters((prev) => ({ ...prev, tripRoute: null }))}
                  className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl sm:rounded-2xl bg-dark-100 hover:bg-dark-200 text-dark-700 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0"
                  title="Exit Road Trip Corridor Search"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              </div>
            </div>

            {/* Quick Controls: Corridor Width Switcher & Filters */}
            <div className="pt-3 border-t border-dark-100 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-dark-500 shrink-0">
                  Corridor Width:
                </span>
                {[15, 25, 50].map((mi) => (
                  <button
                    key={mi}
                    onClick={() => handleUpdateCorridor(mi)}
                    className={`px-2.5 py-1 rounded-full text-xs font-black transition-all cursor-pointer ${
                      searchFilters.tripRoute?.corridorMiles === mi
                        ? 'bg-roo-500 text-white shadow-2xs'
                        : 'bg-dark-100 hover:bg-dark-200 text-dark-700'
                    }`}
                  >
                    ±{mi} miles
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-dark-500 shrink-0">
                  Filter:
                </span>
                {[
                  { id: 'all', label: `All Stops (${filteredSpots.length})` },
                  { id: 'near-highway', label: '⚡ Near Highway (≤3 mi)' },
                  { id: 'big-rig', label: '🚐 Big Rig (35ft+)' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setRouteFilter(tab.id as any)}
                    className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      routeFilter === tab.id
                        ? 'bg-dark-900 text-white shadow-2xs font-black'
                        : 'bg-dark-50 hover:bg-dark-100 text-dark-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Standard View: Card Grid */}
        {!isMapExpanded && (
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex items-center justify-between px-1 gap-2">
              <span className="text-xs font-bold text-dark-700 truncate">
                {searchFilters.tripRoute
                  ? `Showing ${displayedSpots.length.toLocaleString()} havens along road trip`
                  : activeSearchTitle
                  ? `Showing ${displayedSpots.length.toLocaleString()} nearest spots to ${activeSearchTitle}`
                  : `Showing ${displayedSpots.length.toLocaleString()} spots`}
              </span>

              {/* Mobile View Toggle (Cards vs Compact List) */}
              <div className="md:hidden flex items-center bg-dark-100/90 p-0.5 rounded-xl border border-dark-200/80 shrink-0">
                <button
                  type="button"
                  onClick={() => setMobileListMode('card')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                    mobileListMode === 'card'
                      ? 'bg-white text-dark-950 shadow-2xs font-black'
                      : 'text-dark-500 hover:text-dark-900'
                  }`}
                  title="Card View"
                >
                  <LayoutGrid className="w-3 h-3" />
                  <span className="text-[10px]">Cards</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMobileListMode('compact')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                    mobileListMode === 'compact'
                      ? 'bg-white text-dark-950 shadow-2xs font-black'
                      : 'text-dark-500 hover:text-dark-900'
                  }`}
                  title="Compact List View"
                >
                  <List className="w-3 h-3" />
                  <span className="text-[10px]">Compact</span>
                </button>
              </div>
            </div>

            {displayedSpots.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-dark-200">
                <p className="text-xs text-dark-600">
                  No spots found matching your search filters. Try clearing some filters.
                </p>
              </div>
            ) : (
              <>
                {/* Ultra-compact horizontal row listing for mobile when 'compact' mode selected */}
                {mobileListMode === 'compact' && (
                  <div className="md:hidden flex flex-col gap-2">
                    {paginatedSpots.map((spot) => {
                      const isSelected = routedSpot?.id === spot.id;
                      const stopIdx = (spot as any).routeStopIndex;
                      const agency = (spot as any).landManager || (spot as any)._pipeline?.land_manager || spot.environment;
                      return (
                        <div
                          key={spot.id}
                          onClick={() => {
                            setIsMapExpanded(true);
                            handleSpotMapSelect(spot);
                          }}
                          className={`p-2 rounded-2xl border bg-white shadow-2xs flex gap-2.5 cursor-pointer active:scale-[0.99] transition-all ${
                            isSelected
                              ? 'border-roo-500 ring-2 ring-roo-500/20 bg-roo-50/20'
                              : 'border-dark-200/80 hover:border-dark-300'
                          }`}
                        >
                          <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-dark-900 shrink-0 border border-dark-100/60 shadow-2xs">
                            <img
                              src={getOptimizedImageUrl(spot.photos[0], { width: 240, quality: 75 })}
                              alt={cleanSpotTitle(spot.title)}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                const target = e.currentTarget;
                                const raw = getRawImageUrl(spot.photos[0]);
                                if (target.src !== raw && raw !== FALLBACK_CAMPING_PHOTO) {
                                  target.src = raw;
                                } else {
                                  target.src = FALLBACK_CAMPING_PHOTO;
                                }
                              }}
                            />
                            {stopIdx ? (
                              <div className="absolute top-1 left-1 bg-gradient-to-r from-roo-500 to-amber-500 text-white px-1.5 py-0.5 rounded text-[8px] font-black leading-none">
                                #{stopIdx}
                              </div>
                            ) : (
                              <div className="absolute top-1 left-1 bg-dark-950/80 text-white px-1.5 py-0.5 rounded text-[8px] font-black">
                                FREE
                              </div>
                            )}
                            <div className="absolute bottom-1 right-1 bg-roo-600/90 text-white px-1 py-0.2 rounded text-[8px] font-bold">
                              {spot.rigCompatibility?.maxLengthFt || 35}ft
                            </div>
                          </div>

                          <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                            <div>
                              <div className="flex items-center justify-between text-[10px] text-dark-500 font-bold mb-0.5">
                                <span className="truncate max-w-[140px]">{spot.locationName}</span>
                                <div className="flex items-center gap-1 shrink-0">
                                  <span className="text-dark-900 font-extrabold flex items-center gap-0.5">
                                    <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                                    <span>{spot.rating || 4.8}</span>
                                  </span>
                                </div>
                              </div>

                              <h5 className="text-xs font-black text-dark-950 truncate leading-tight mb-0.5">
                                {cleanSpotTitle(spot.title)}
                              </h5>

                              {searchFilters.tripRoute && stopIdx && (spot as any).arrivalTimeFormatted ? (
                                <p className="text-[10px] text-roo-700 font-extrabold flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5 text-roo-600 shrink-0" />
                                  <span>Arrive ~{(spot as any).arrivalTimeFormatted} ({(spot as any).formattedDriveDuration})</span>
                                </p>
                              ) : (
                                <p className="text-[10px] text-dark-600 truncate">
                                  <span className="font-bold text-forest-700">{agency?.toUpperCase() || 'PUBLIC LAND'}</span>
                                  <span> · Max {spot.rigCompatibility.maxLengthFt}ft</span>
                                  {(spot as any).distanceMiles !== undefined && (spot as any).distanceMiles < 800 && (
                                    <span className="text-blue-700 font-bold ml-1">
                                      · {((spot as any).distanceMiles < 1 ? '< 1' : (spot as any).distanceMiles.toFixed(1))} mi
                                    </span>
                                  )}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center justify-between pt-1 border-t border-dark-100 text-[10px]">
                              <span className="font-black text-dark-900">$0 Free</span>
                              <div className="flex items-center gap-2">
                                <a
                                  href={`https://www.google.com/maps/dir/?api=1&destination=${spot.coordinates[0]},${spot.coordinates[1]}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-blue-600 font-bold hover:underline text-[10px]"
                                >
                                  GPS ↗
                                </a>
                                <span className="text-roo-600 font-bold flex items-center gap-0.5">
                                  <span>View</span>
                                  <ArrowRight className="w-2.5 h-2.5" />
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Standard / Cards Grid (shown on desktop always, and on mobile when 'card' mode) */}
                <div className={`${mobileListMode === 'compact' ? 'hidden md:grid' : 'grid'} grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6`}>
                  {paginatedSpots.map((spot) => {
                    const host = users.find((u) => u.id === spot.hostId);
                    const isSelected = routedSpot?.id === spot.id;
                    const stopIdx = (spot as any).routeStopIndex;
                    const roadTripStop = searchFilters.tripRoute && stopIdx ? {
                      stopIndex: stopIdx,
                      arrivalTimeFormatted: (spot as any).arrivalTimeFormatted,
                      formattedDriveDuration: (spot as any).formattedDriveDuration,
                      distanceToRoute: (spot as any).distanceToRoute,
                    } : undefined;

                    return (
                      <div
                        key={spot.id}
                        className={`relative rounded-2xl sm:rounded-3xl transition-all ${
                          isSelected ? 'ring-2 ring-roo-500 shadow-md' : ''
                        }`}
                        onClick={() => {
                          setIsMapExpanded(true);
                          handleSpotMapSelect(spot);
                        }}
                      >
                        <SpotCard
                          spot={spot}
                          host={host}
                          isHovered={hoveredSpotId === spot.id || isSelected}
                          onHover={setHoveredSpotId}
                          onSelect={() => {
                            setIsMapExpanded(true);
                            handleSpotMapSelect(spot);
                          }}
                          onRequest={onRequestStay}
                          roadTripStop={roadTripStop}
                        />
                      </div>
                    );
                  })}

                  {paginatedSpots.length < displayedSpots.length && (
                    <div className="col-span-full flex justify-center py-6">
                      <button
                        onClick={() => setVisibleCount((prev) => prev + 24)}
                        className="px-6 py-2.5 rounded-2xl bg-dark-900 hover:bg-black text-white text-xs font-black shadow-sm transition-all hover:scale-105 active:scale-95"
                      >
                        Load More Havens (+24) · {displayedSpots.length - paginatedSpots.length} remaining
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Full Map View: Dedicated Side-by-Side Split View */}
        {isMapExpanded && (
          <div className="w-full h-[calc(100vh-108px)] sm:h-[calc(100dvh-108px)] min-h-[520px] flex flex-col md:flex-row overflow-hidden border-t border-dark-200 bg-white relative">
            {/* DESKTOP SIDEBAR: 1 Row for spots on the left next to the map */}
            <div
              className={`hidden md:flex flex-col bg-white border-r border-dark-200 shrink-0 transition-all duration-300 z-20 ${
                showSideListingOnFull
                  ? 'w-[380px] lg:w-[410px] xl:w-[430px]'
                  : 'w-0 overflow-hidden border-r-0'
              }`}
            >
              {/* Sidebar Header */}
              <div className="p-3 border-b border-dark-100 bg-white flex flex-col gap-2 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        displayedSpots.length > 0 ? 'bg-forest-600 animate-pulse' : 'bg-amber-500'
                      }`}
                    />
                    <span className="text-xs font-black text-dark-950">
                      {displayedSpots.length.toLocaleString()} Havens in View
                    </span>
                    {displayedSpots.length > 0 && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-dark-100 text-dark-600 font-bold">
                        Showing {Math.min(visibleSidebarCount, displayedSpots.length)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setIsMapExpanded(false);
                        window.dispatchEvent(new Event('resize'));
                      }}
                      className="p-1.5 rounded-xl hover:bg-dark-100 text-dark-600 hover:text-dark-950 transition-colors cursor-pointer"
                      title="Switch to Standard Grid View"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleToggleSideListing(false)}
                      className="p-1.5 rounded-xl hover:bg-dark-100 text-dark-600 hover:text-dark-950 transition-colors cursor-pointer"
                      title="Collapse sidebar for full map"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Road trip itinerary control header inside sidebar if active */}
                {searchFilters.tripRoute && (
                  <div className="p-3 bg-gradient-to-br from-roo-500/10 via-amber-500/5 to-white rounded-2xl border border-roo-200/90 shadow-2xs space-y-2">
                    {/* Origin to Destination */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase tracking-wider">
                            Start
                          </span>
                          <span className="text-xs font-black text-dark-950 truncate max-w-[130px]">
                            {searchFilters.tripRoute.origin.title}
                          </span>
                          <span className="text-dark-400 text-xs">➔</span>
                          <span className="px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800 text-[9px] font-black uppercase tracking-wider">
                            Finish
                          </span>
                          <span className="text-xs font-black text-dark-950 truncate max-w-[130px]">
                            {searchFilters.tripRoute.destination.title}
                          </span>
                        </div>

                        {/* Trip stats & ETAs */}
                        <div className="flex items-center gap-2 text-[10px] font-bold text-dark-600 flex-wrap">
                          <span>🛣️ {searchFilters.tripRoute.distanceMiles} mi ({searchFilters.tripRoute.formattedDuration})</span>
                          {finalDestinationETA && (
                            <>
                              <span className="text-dark-300">·</span>
                              <span className="text-amber-800 font-extrabold flex items-center gap-0.5">
                                <Flag className="w-2.5 h-2.5 text-amber-600" />
                                <span>Final Arrival ~{finalDestinationETA}</span>
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => setSearchFilters((prev) => ({ ...prev, tripRoute: null }))}
                        className="p-1 rounded-lg text-dark-400 hover:text-dark-900 hover:bg-white border border-transparent hover:border-dark-200 transition-colors shrink-0 cursor-pointer"
                        title="Clear road trip"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Corridor Width & Filter Chips */}
                    <div className="pt-1.5 border-t border-roo-200/60 flex flex-col gap-1.5">
                      {/* Corridor Width Buttons */}
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-extrabold text-dark-500 uppercase tracking-wider text-[9px]">
                          Corridor:
                        </span>
                        <div className="flex items-center gap-1">
                          {[15, 25, 50].map((mi) => (
                            <button
                              key={mi}
                              onClick={() => handleUpdateCorridor(mi)}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                                searchFilters.tripRoute?.corridorMiles === mi
                                  ? 'bg-dark-900 text-white shadow-2xs'
                                  : 'bg-white text-dark-700 hover:bg-roo-50 border border-dark-200/60'
                              }`}
                            >
                              ±{mi} mi
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Filter Chips: All, Near Highway, Big Rig */}
                      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
                        {[
                          { id: 'all', label: `All (${filteredSpots.length})` },
                          { id: 'near-highway', label: '⚡ ≤3mi off road' },
                          { id: 'big-rig', label: '🚐 Big Rig' },
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() => setRouteFilter(tab.id as any)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all shrink-0 cursor-pointer ${
                              routeFilter === tab.id
                                ? 'bg-roo-500 text-white shadow-2xs'
                                : 'bg-white text-dark-600 hover:bg-dark-100 border border-dark-200/60'
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-header controls */}
                <div className="flex items-center justify-between gap-1.5 text-xs">
                  {!searchFilters.tripRoute && userLocation ? (
                    <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
                      <span className="text-[9px] font-black uppercase tracking-wider text-dark-400 shrink-0">
                        Radius:
                      </span>
                      {[25, 50, 100, 250].map((r) => (
                        <button
                          key={r}
                          onClick={() => setSelectedRadiusMiles(selectedRadiusMiles === r ? null : r)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all shrink-0 cursor-pointer ${
                            selectedRadiusMiles === r
                              ? 'bg-roo-500 text-white shadow-2xs'
                              : 'bg-dark-50 text-dark-600 hover:bg-dark-100'
                          }`}
                        >
                          {r}mi
                        </button>
                      ))}
                      <button
                        onClick={() => setSelectedRadiusMiles(null)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all shrink-0 cursor-pointer ${
                          selectedRadiusMiles === null
                            ? 'bg-dark-900 text-white shadow-2xs'
                            : 'bg-dark-50 text-dark-600 hover:bg-dark-100'
                        }`}
                      >
                        All
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[11px] text-dark-500 font-semibold">
                      <span>🌲 Public lands camping</span>
                      <span>·</span>
                      <span className="text-forest-700 font-bold">100% Free</span>
                    </div>
                  )}

                  {routedSpot && (
                    <button
                      onClick={handleClearRoute}
                      className="text-[10px] font-bold text-dark-500 hover:text-roo-600 underline shrink-0 cursor-pointer ml-auto"
                    >
                      Clear selection
                    </button>
                  )}
                </div>
              </div>

              {/* If a spot is routed (and not in road trip mode where order is preserved in timeline): Compact, Sleek Selected Haven Card */}
              {routedSpot && !searchFilters.tripRoute && (
                <div className="p-2.5 bg-gradient-to-r from-roo-50/70 via-white to-roo-50/40 border-b border-dark-100 shrink-0 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    {/* Thumbnail with overlay badges */}
                    <div
                      onClick={() => handleNavigateToDetails(routedSpot.id)}
                      className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-dark-900 shrink-0 cursor-pointer border border-dark-100/60 shadow-2xs group"
                      title="Click to view details"
                    >
                      <img
                        src={getOptimizedImageUrl(routedSpot.photos[0], { width: 160, quality: 75 })}
                        alt={cleanSpotTitle(routedSpot.title)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          const target = e.currentTarget;
                          const raw = getRawImageUrl(routedSpot.photos[0]);
                          if (target.src !== raw && raw !== FALLBACK_CAMPING_PHOTO) {
                            target.src = raw;
                          } else {
                            target.src = FALLBACK_CAMPING_PHOTO;
                          }
                        }}
                      />
                      <div className="absolute top-1 left-1 bg-dark-950/85 text-white px-1.5 py-0.5 rounded text-[8px] font-black leading-none">
                        FREE
                      </div>
                      <div className="absolute bottom-1 right-1 bg-roo-500 text-white px-1 py-0.5 rounded text-[8px] font-black leading-none">
                        {routedSpot.rigCompatibility?.maxLengthFt || 35}ft
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="px-1.5 py-0.2 rounded bg-forest-50 text-forest-700 border border-forest-200/50 uppercase text-[9px] font-black shrink-0">
                            {(routedSpot as any).agency || 'USFS'}
                          </span>
                          <span className="truncate text-dark-500 font-medium text-[10px]">
                            {routedSpot.locationName}
                          </span>
                        </div>
                        <button
                          onClick={handleClearRoute}
                          className="p-1 rounded-lg text-dark-400 hover:text-dark-900 hover:bg-dark-100 transition-colors shrink-0 cursor-pointer"
                          title="Deselect spot"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <h4
                        onClick={() => handleNavigateToDetails(routedSpot.id)}
                        className="text-xs font-black text-dark-950 truncate leading-snug cursor-pointer hover:text-roo-600 transition-colors mb-1"
                        title={routedSpot.title}
                      >
                        {cleanSpotTitle(routedSpot.title)}
                      </h4>

                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-dark-600">
                          <span className="text-amber-500 font-black">★ {routedSpot.rating || 4.8}</span>
                          {(routedSpot as any).distanceMiles !== undefined && (routedSpot as any).distanceMiles < 800 && (
                            <>
                              <span className="text-dark-300">·</span>
                              <span className="text-blue-700 font-extrabold">
                                📍 {((routedSpot as any).distanceMiles < 1 ? '< 1' : (routedSpot as any).distanceMiles.toFixed(1))} mi
                              </span>
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => onRequestStay(routedSpot)}
                            className="px-2 py-1 rounded-lg bg-roo-500 hover:bg-roo-600 text-white text-[10px] font-black transition-all shadow-2xs active:scale-95 cursor-pointer"
                            title="Request stay"
                          >
                            Request
                          </button>
                          <button
                            onClick={() => handleNavigateToDetails(routedSpot.id)}
                            className="px-2.5 py-1 rounded-lg bg-dark-900 hover:bg-black text-white text-[10px] font-black transition-all shadow-2xs active:scale-95 flex items-center gap-0.5 cursor-pointer"
                            title="View listing details"
                          >
                            <span>Details</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Other Spots Header */}
              {routedSpot && !searchFilters.tripRoute && otherSpots.length > 0 && (
                <div className="px-3 pt-2.5 pb-1 flex items-center justify-between bg-white border-b border-dark-100 shrink-0">
                  <span className="text-[10px] font-black uppercase tracking-wider text-dark-500">
                    Other Havens in View ({otherSpots.length})
                  </span>
                  <span className="text-[10px] text-dark-400 font-semibold">Click to preview</span>
                </div>
              )}

              {/* Scrollable list with 1 row per spot / Road Trip Itinerary Timeline */}
              <div
                ref={sideListingScrollRef}
                onScroll={handleSidebarScroll}
                className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-2 custom-scrollbar bg-dark-50/30"
              >
                {/* Empty State when 0 spots in map view */}
                {displayedSpots.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center my-auto animate-fade-in">
                    <div className="w-12 h-12 rounded-2xl bg-roo-50 text-roo-500 flex items-center justify-center mb-3 shadow-2xs">
                      <Compass className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-black text-dark-950 mb-1">
                      0 Havens in this Map View
                    </h4>
                    <p className="text-xs text-dark-500 max-w-xs mb-4 leading-relaxed">
                      You are viewing an area with no registered public land camps. CampRoo features 9,777+ free USFS & BLM havens across the United States.
                    </p>
                    <button
                      onClick={handleJumpToUSHavens}
                      className="px-4 py-2.5 rounded-xl bg-dark-900 hover:bg-black text-white text-xs font-black shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 mb-4"
                    >
                      <span>🗺️ Jump to US Havens</span>
                    </button>
                    <div className="w-full pt-3 border-t border-dark-200/60">
                      <span className="text-[10px] font-black uppercase text-dark-400 tracking-wider block mb-2">
                        Popular Camping Regions
                      </span>
                      <div className="flex flex-wrap gap-1.5 justify-center">
                        {POPULAR_REGIONS.map((reg) => (
                          <button
                            key={reg.name}
                            onClick={() => handleJumpToRegion(reg)}
                            className="px-2.5 py-1 rounded-lg bg-white hover:bg-roo-50 hover:text-roo-700 text-dark-700 text-[11px] font-bold border border-dark-200/80 shadow-2xs transition-all cursor-pointer"
                          >
                            {reg.emoji} {reg.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Road Trip: Origin / Departure Node */}
                    {searchFilters.tripRoute && (
                      <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-white to-emerald-500/5 border border-emerald-500/30 shadow-2xs">
                        <div className="flex flex-col items-center shrink-0 mt-0.5">
                          <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] font-black shadow-xs ring-2 ring-emerald-100">
                            🟢
                          </div>
                          <div className="w-0.5 h-6 bg-gradient-to-b from-emerald-500 to-dark-200 mt-1" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-emerald-700">
                            <span>START POINT</span>
                            <span>·</span>
                            <span className="text-dark-500 font-bold flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5" /> Leaving Now ({formatArrivalTime(departureTime, departureTime)})
                            </span>
                          </div>
                          <h4 className="text-xs font-black text-dark-950 truncate mt-0.5">
                            {searchFilters.tripRoute.origin.title}
                          </h4>
                        </div>
                      </div>
                    )}

                    {(routedSpot ? otherSpots : displayedSpots)
                      .slice(0, visibleSidebarCount)
                      .map((spot) => {
                        const isSelected = routedSpot?.id === spot.id;
                        const agency = (spot as any).landManager || (spot as any)._pipeline?.land_manager || spot.environment;
                        const cleanLoc = getSpotDisplayLocation(spot);
                        const stopIdx = (spot as any).routeStopIndex;
                        return (
                          <div
                            key={spot.id}
                            onClick={() => handleSpotMapSelect(spot)}
                            onMouseEnter={() => setHoveredSpotId(spot.id)}
                            onMouseLeave={() => setHoveredSpotId(null)}
                            className={`group relative flex flex-col p-2.5 rounded-2xl bg-white border transition-all cursor-pointer select-none ${
                              isSelected
                                ? 'border-roo-500 ring-2 ring-roo-500/25 bg-roo-50/20 shadow-xs'
                                : 'border-dark-200/80 hover:border-dark-300 hover:bg-slate-50/50 hover:shadow-2xs'
                            }`}
                          >
                            {/* Road trip stop timing banner if in road trip mode */}
                            {searchFilters.tripRoute && stopIdx && (
                              <div className="flex items-center justify-between gap-1 mb-2 px-2 py-1 rounded-xl bg-gradient-to-r from-amber-500/15 via-roo-500/10 to-amber-500/5 border border-roo-300/60">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="px-1.5 py-0.2 rounded-md bg-gradient-to-r from-roo-500 to-amber-500 text-white font-black text-[9px] tracking-wider shadow-2xs shrink-0">
                                    STOP #{stopIdx}
                                  </span>
                                  <span className="text-[10px] font-black text-dark-900 truncate flex items-center gap-1">
                                    <Clock className="w-2.5 h-2.5 text-roo-600 shrink-0" />
                                    <span>Arrive ~{(spot as any).arrivalTimeFormatted}</span>
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 text-[9px] font-extrabold text-dark-600 shrink-0">
                                  <span>{(spot as any).formattedDriveDuration}</span>
                                  {(spot as any).distanceToRoute !== undefined && (
                                    <>
                                      <span>·</span>
                                      <span className="text-roo-700">
                                        {((spot as any).distanceToRoute < 1 ? '< 1' : (spot as any).distanceToRoute.toFixed(1))} mi off route
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}

                            <div className="flex flex-row items-center gap-2.5">
                              {/* Left Thumbnail with fixed dimensions */}
                              <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-xl overflow-hidden shrink-0 bg-slate-100 dark:bg-dark-900 border border-dark-100/60 shadow-2xs">
                                <img
                                  src={getOptimizedImageUrl(spot.photos[0], { width: 200, quality: 75 })}
                                  alt={cleanSpotTitle(spot.title)}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                  loading="lazy"
                                  onError={(e) => {
                                    const target = e.currentTarget;
                                    const raw = getRawImageUrl(spot.photos[0]);
                                    if (target.src !== raw && raw !== FALLBACK_CAMPING_PHOTO) {
                                      target.src = raw;
                                    } else {
                                      target.src = FALLBACK_CAMPING_PHOTO;
                                    }
                                  }}
                                />
                                <div className="absolute top-1 left-1 bg-dark-950/85 text-white px-1.5 py-0.5 rounded text-[8px] font-black leading-none">
                                  FREE
                                </div>
                                <div className="absolute bottom-1 right-1 bg-roo-500 text-white px-1 py-0.5 rounded text-[8px] font-black leading-none">
                                  {spot.rigCompatibility?.maxLengthFt || 35}ft
                                </div>
                              </div>

                              {/* Right Info */}
                              <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 h-full">
                                <div>
                                  <div className="flex items-center justify-between text-[10px] text-dark-500 font-bold mb-0.5">
                                    <div className="flex items-center gap-1 min-w-0">
                                      <span className="px-1.5 py-0.2 rounded bg-forest-50 text-forest-700 border border-forest-200/50 uppercase text-[9px] font-black shrink-0">
                                        {agency}
                                      </span>
                                      <span className="truncate max-w-[120px] text-dark-500 font-medium">
                                        {cleanLoc}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0 ml-1">
                                      {(spot as any).distanceMiles !== undefined && (spot as any).distanceMiles < 800 && (
                                        <span className="text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded font-extrabold text-[9px] border border-blue-200/50">
                                          📍 {((spot as any).distanceMiles < 1 ? '< 1' : (spot as any).distanceMiles.toFixed(1))} mi
                                        </span>
                                      )}
                                      <span className="text-dark-900 font-extrabold flex items-center gap-0.5">
                                        <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                                        <span>{spot.rating || 4.8}</span>
                                      </span>
                                    </div>
                                  </div>

                                  <h5 className="text-xs font-black text-dark-950 truncate leading-tight mb-0.5 group-hover:text-roo-600 transition-colors">
                                    {cleanSpotTitle(spot.title)}
                                  </h5>

                                  <p className="text-[10px] text-dark-500 line-clamp-1">
                                    {spot.environment.toUpperCase()} · Max {spot.rigCompatibility?.maxLengthFt || 35}ft rig
                                  </p>
                                </div>

                                <div className="flex items-center justify-between pt-1 border-t border-dark-100 text-[10px] mt-1">
                                  <span className={`font-extrabold flex items-center gap-1 ${isSelected ? 'text-roo-600' : 'text-dark-500 group-hover:text-dark-800'}`}>
                                    <span>{isSelected ? '📍 Selected on Map' : 'Preview'}</span>
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleNavigateToDetails(spot.id);
                                    }}
                                    className="px-2.5 py-0.5 rounded-lg bg-dark-100 hover:bg-dark-900 hover:text-white text-dark-900 text-[10px] font-black transition-all cursor-pointer flex items-center gap-1"
                                    title="View full listing details"
                                  >
                                    <span>Details</span>
                                    <ArrowRight className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                    {/* Road Trip: Destination / Finish Node */}
                    {searchFilters.tripRoute && (
                      <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-white to-amber-500/5 border border-amber-500/30 shadow-2xs">
                        <div className="flex flex-col items-center shrink-0 mt-0.5">
                          <div className="w-0.5 h-3 bg-gradient-to-b from-dark-200 to-amber-500 mb-1" />
                          <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs shadow-xs ring-2 ring-amber-100">
                            🏁
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-amber-700">
                            <span>FINISH DESTINATION</span>
                            <span>·</span>
                            <span className="text-dark-500 font-bold">
                              {searchFilters.tripRoute.distanceMiles} mi total ({searchFilters.tripRoute.formattedDuration})
                            </span>
                          </div>
                          <h4 className="text-xs font-black text-dark-950 truncate mt-0.5">
                            {searchFilters.tripRoute.destination.title}
                          </h4>
                          {finalDestinationETA && (
                            <div className="text-[10px] font-extrabold text-amber-800 mt-0.5 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Final Arrival ~{finalDestinationETA}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Infinite scroll indicator / Load more button */}
                    {visibleSidebarCount < (routedSpot ? otherSpots : displayedSpots).length && (
                      <div className="p-3 text-center">
                        <button
                          onClick={() => setVisibleSidebarCount((c) => Math.min(c + 20, (routedSpot ? otherSpots : displayedSpots).length))}
                          className="w-full py-2 rounded-xl bg-white hover:bg-dark-100 text-dark-700 text-xs font-bold border border-dark-200 shadow-2xs transition-all cursor-pointer"
                        >
                          Load more ({(routedSpot ? otherSpots : displayedSpots).length - visibleSidebarCount} remaining)
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* MAP CANVAS: Right Side taking all remaining space */}
            <div className="flex-1 h-full relative overflow-hidden bg-dark-50">
              {/* Expand sidebar button when collapsed */}
              {!showSideListingOnFull && (
                <button
                  onClick={() => handleToggleSideListing(true)}
                  className="absolute top-3 left-3 z-[450] bg-white/95 backdrop-blur-xl px-3.5 py-2 rounded-2xl text-xs font-black text-dark-950 flex items-center gap-2 shadow-lg border border-dark-200 hover:bg-white active:scale-95 transition-all cursor-pointer"
                  title="Show Havens List"
                >
                  <ChevronRight className="w-4 h-4 text-roo-500" />
                  <span>Havens ({displayedSpots.length.toLocaleString()})</span>
                </button>
              )}

              <InteractiveMap
                allSpots={filteredSpots}
                visibleSpots={displayedSpots}
                hoveredSpotId={hoveredSpotId}
                selectedSpotId={routedSpot ? routedSpot.id : null}
                onSelectSpot={handleSpotMapSelect}
                onBoundsChange={handleBoundsChange}
                activeRoute={activeRoute}
                origin={origin}
                onChangeOrigin={handleChangeOrigin}
                isSimulatingDrive={isSimulatingDrive}
                onSimulationEnd={() => setIsSimulatingDrive(false)}
                isExpanded={true}
                onToggleExpand={() => {
                  setIsMapExpanded(false);
                  window.dispatchEvent(new Event('resize'));
                }}
                radiusMiles={selectedRadiusMiles}
                onSelectRadius={setSelectedRadiusMiles}
                targetView={targetView}
                searchQuery={searchFilters.locationQuery}
                onSearchChange={(q) => setSearchFilters((prev) => ({ ...prev, locationQuery: q }))}
                onSelectArea={handleSelectArea}
                onClearSearch={handleClearSearch}
                activeAgencyFilter={searchFilters.landManager}
                onChangeAgencyFilter={(agency) => setSearchFilters((prev) => ({ ...prev, landManager: agency }))}
                onNavigateToDetails={handleNavigateToDetails}
                onRequestStay={onRequestStay}
                tripRoute={searchFilters.tripRoute}
                className="w-full h-full"
              />

              {/* Floating Uber Route Drawer: Centered on desktop */}
              <AnimatePresence>
                {routedSpot && (
                  <div className="hidden md:block absolute bottom-4 left-1/2 -translate-x-1/2 z-[480] pointer-events-auto max-w-full">
                    <UberRouteDrawer
                      spot={routedSpot}
                      originCoords={origin.coordinates}
                      route={activeRoute}
                      isLoadingRoute={isLoadingRoute}
                      onClearRoute={handleClearRoute}
                      onViewSpotDetails={handleNavigateToDetails}
                      onRequestStay={onRequestStay}
                      isRoadTripMode={!!searchFilters.tripRoute}
                      stopNumber={(routedSpot as any)?.routeStopIndex}
                      totalStops={searchFilters.tripRoute ? filteredSpots.length : undefined}
                      formattedArrivalTime={(routedSpot as any)?.arrivalTimeFormatted}
                      timeFromStartFormatted={(routedSpot as any)?.formattedDriveDuration}
                      detourMiles={(routedSpot as any)?.distanceToRoute}
                      mileMarker={(routedSpot as any)?.mileMarker}
                    />
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* MOBILE EXPERIENCE: Bottom Docked Preview Card */}
            <div className="md:hidden">
              {/* Mobile Spot Preview Card (when a spot IS selected) */}
              <AnimatePresence>
                {routedSpot && (
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 15, scale: 0.98 }}
                    transition={{ type: 'spring', damping: 28, stiffness: 380 }}
                    onClick={() => handleNavigateToDetails(routedSpot.id)}
                    className="absolute bottom-[calc(env(safe-area-inset-bottom,8px)+66px)] inset-x-3 sm:inset-x-auto sm:bottom-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-[380px] sm:max-w-sm z-[485] bg-white/95 backdrop-blur-2xl rounded-2xl p-2 border border-dark-200/90 shadow-[0_8px_28px_rgba(0,0,0,0.18)] pointer-events-auto cursor-pointer active:scale-[0.99] transition-transform"
                  >
                    <div className="flex items-center gap-2.5">
                      {/* Compact Photo Thumbnail */}
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-100 dark:bg-dark-900 border border-dark-100/60 shrink-0 shadow-2xs">
                        <img
                          src={getOptimizedImageUrl(routedSpot.photos[0], { width: 160, quality: 75 })}
                          alt={cleanSpotTitle(routedSpot.title)}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.currentTarget;
                            const raw = getRawImageUrl(routedSpot.photos[0]);
                            if (target.src !== raw && raw !== FALLBACK_CAMPING_PHOTO) {
                              target.src = raw;
                            } else {
                              target.src = FALLBACK_CAMPING_PHOTO;
                            }
                          }}
                        />
                        {searchFilters.tripRoute && (routedSpot as any)?.routeStopIndex ? (
                          <div className="absolute top-1 left-1 bg-gradient-to-r from-roo-500 to-amber-500 text-white px-1 py-0.2 rounded text-[8px] font-black leading-none">
                            STOP #{(routedSpot as any)?.routeStopIndex}
                          </div>
                        ) : (
                          <div className="absolute top-1 left-1 bg-dark-950/85 text-white px-1 py-0.2 rounded text-[8px] font-black leading-none">
                            FREE
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 pr-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-roo-50 text-roo-700 shrink-0">
                            {(routedSpot as any).landManager || routedSpot.environment || 'HAVEN'}
                          </span>
                          <span className="text-[10px] font-bold text-dark-500 truncate">
                            {getSpotDisplayLocation(routedSpot)}
                          </span>
                        </div>

                        <h4 className="text-xs font-black text-dark-950 truncate leading-snug">
                          {routedSpot.title}
                        </h4>

                        {searchFilters.tripRoute && (routedSpot as any)?.arrivalTimeFormatted ? (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-dark-700 mt-0.5 truncate">
                            <span className="text-roo-600 font-black">Arrive ~{(routedSpot as any).arrivalTimeFormatted}</span>
                            <span>·</span>
                            <span>{(routedSpot as any).formattedDriveDuration}</span>
                            {(routedSpot as any).distanceToRoute !== undefined && (
                              <>
                                <span>·</span>
                                <span className="text-dark-500">{((routedSpot as any).distanceToRoute < 1 ? '< 1' : (routedSpot as any).distanceToRoute.toFixed(1))} mi off route</span>
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[10px] font-semibold text-dark-600 mt-0.5">
                            <span className="text-amber-500 font-black">★ {routedSpot.rating}</span>
                            <span>·</span>
                            <span className="text-emerald-700 font-extrabold">Max {routedSpot.rigCompatibility?.maxLengthFt || 35}ft</span>
                            {activeRoute && (
                              <>
                                <span>·</span>
                                <span className="text-blue-600 font-bold">🚗 {activeRoute.formattedDuration}</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Quick Actions (e.stopPropagation prevents triggering card navigation) */}
                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <a
                          href={getGoogleMapsNavigationUrl(origin.coordinates, routedSpot.coordinates, routedSpot.title)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 flex items-center justify-center active:scale-95 transition-all"
                          title="Open GPS Navigation"
                        >
                          <Navigation className="w-3.5 h-3.5 text-blue-600" />
                        </a>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClearRoute();
                          }}
                          className="p-2 rounded-xl bg-dark-50 hover:bg-dark-100 text-dark-400 hover:text-dark-700 active:scale-95 transition-all"
                          title="Close preview"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Mobile Bottom Sheet Modal (when user taps "Browse List" on mobile) */}
        <AnimatePresence>
          {isMapExpanded && isMobileSheetOpen && (
            <div className="md:hidden fixed inset-0 z-[600] flex flex-col justify-end bg-black/50 backdrop-blur-xs">
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="bg-white rounded-t-3xl border-t border-dark-200/90 shadow-2xl flex flex-col max-h-[82vh] overflow-hidden"
              >
                {/* Pull Indicator & Header */}
                <div className="pt-2.5 pb-2 px-4 border-b border-dark-100 flex flex-col shrink-0 bg-white">
                  <div className="w-10 h-1 rounded-full bg-dark-300 mx-auto mb-2.5" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-forest-600 animate-pulse" />
                      <span className="text-sm font-black text-dark-950">
                        {activeSearchTitle
                          ? `Nearest to ${activeSearchTitle} (${displayedSpots.length.toLocaleString()})`
                          : `${displayedSpots.length.toLocaleString()} Havens Found`}
                      </span>
                    </div>
                    <button
                      onClick={() => setIsMobileSheetOpen(false)}
                      className="px-3 py-1 rounded-full bg-dark-100 hover:bg-dark-200 text-dark-800 text-xs font-extrabold flex items-center gap-1 cursor-pointer"
                    >
                      <MapPin className="w-3 h-3 text-forest-600" />
                      <span>Map View</span>
                    </button>
                  </div>
                </div>

                {/* Spots Scrollable Body */}
                <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5 custom-scrollbar">
                  {displayedSpots.slice(0, 50).map((spot) => (
                    <div
                      key={spot.id}
                      onClick={() => {
                        handleSpotMapSelect(spot);
                        setIsMobileSheetOpen(false);
                      }}
                      className="p-2.5 rounded-2xl border border-dark-200/80 hover:border-forest-300 bg-white shadow-2xs flex gap-3 cursor-pointer active:scale-[0.99] transition-all"
                    >
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-dark-900 border border-dark-100/60 shrink-0 shadow-2xs">
                        <img
                          src={getOptimizedImageUrl(spot.photos[0], { width: 240, quality: 75 })}
                          alt={cleanSpotTitle(spot.title)}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.currentTarget;
                            const raw = getRawImageUrl(spot.photos[0]);
                            if (target.src !== raw && raw !== FALLBACK_CAMPING_PHOTO) {
                              target.src = raw;
                            } else {
                              target.src = FALLBACK_CAMPING_PHOTO;
                            }
                          }}
                        />
                        <div className="absolute top-1 left-1 bg-dark-950/80 text-white px-1.5 py-0.5 rounded text-[8px] font-black">
                          FREE
                        </div>
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        <div>
                          <div className="flex items-center justify-between text-[10px] text-dark-500 font-bold mb-0.5">
                            <span className="truncate max-w-[140px]">{spot.locationName}</span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {(spot as any).distanceMiles !== undefined && (spot as any).distanceMiles < 800 && (
                                <span className="text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded font-extrabold text-[9px] border border-blue-200/50">
                                  📍 {((spot as any).distanceMiles < 1 ? '< 1' : (spot as any).distanceMiles.toFixed(1))} mi
                                </span>
                              )}
                              <span className="text-dark-900 font-extrabold">★ {spot.rating}</span>
                            </div>
                          </div>
                          <h5 className="text-xs font-black text-dark-950 truncate leading-tight mb-1">
                            {cleanSpotTitle(spot.title)}
                          </h5>
                          <p className="text-[10px] text-dark-600 line-clamp-1">
                            {spot.environment.toUpperCase()} · Max {spot.rigCompatibility.maxLengthFt}ft
                          </p>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-dark-100 text-[10px]">
                          <span className="text-roo-600 font-black">Tap to view on map</span>
                          <span className="text-dark-400 font-bold">Details →</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Mobile Map / List Toggle Button (hidden when a spot preview is active) */}
      {!routedSpot && (
        <div className="md:hidden fixed bottom-[calc(env(safe-area-inset-bottom,8px)+66px)] left-1/2 -translate-x-1/2 z-[490] pointer-events-auto select-none">
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={() => {
              setIsMapExpanded(!isMapExpanded);
              window.dispatchEvent(new Event('resize'));
            }}
            className="bg-dark-950/95 backdrop-blur-2xl text-white px-4 py-2 rounded-full shadow-[0_8px_25px_rgba(0,0,0,0.35)] border border-white/20 flex items-center gap-1.5 text-xs font-black tracking-wide cursor-pointer"
          >
            {isMapExpanded ? (
              <>
                <LayoutGrid className="w-3.5 h-3.5 text-roo-400" />
                <span>Show Spots List</span>
              </>
            ) : (
              <>
                <MapPin className="w-3.5 h-3.5 text-roo-500" />
                <span>Interactive Map</span>
              </>
            )}
          </motion.button>
        </div>
      )}

      {/* Filter Modal */}
      <AnimatePresence>
        {showFiltersModal && (
          <div className="fixed inset-0 z-[700] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
            <div
              className="absolute inset-0"
              onClick={() => setShowFiltersModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="relative z-10 bg-white rounded-3xl w-full max-w-lg overflow-hidden border border-dark-200 shadow-float max-h-[92dvh] flex flex-col"
            >
              <div className="p-4 sm:p-5 border-b border-dark-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowFiltersModal(false)}
                  className="p-1.5 rounded-full hover:bg-dark-100 text-dark-600"
                >
                  <X className="w-5 h-5" />
                </button>
                <h3 className="font-extrabold text-sm text-dark-900">Filter Free Spots</h3>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs font-bold text-dark-600 underline hover:text-dark-900"
                >
                  Clear all
                </button>
              </div>

              <div className="p-3 sm:p-5 overflow-y-auto flex-1 overscroll-contain">
                <FilterPanel className="border-0 shadow-none p-0 rounded-none bg-transparent" onClose={() => setShowFiltersModal(false)} />
              </div>

              <div className="p-4 border-t border-dark-200 flex items-center justify-between bg-dark-50">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs font-bold text-dark-700 underline"
                >
                  Clear all
                </button>
                <button
                  type="button"
                  onClick={() => setShowFiltersModal(false)}
                  className="px-6 py-3 rounded-2xl bg-dark-900 hover:bg-black text-white text-xs font-bold"
                >
                  Show {filteredSpots.length} Spots
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
