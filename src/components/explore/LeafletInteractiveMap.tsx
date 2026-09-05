import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import L from 'leaflet';
import { Spot, SearchFilterState } from '../../types';
import { RouteOrigin, RouteResult, DEFAULT_ORIGINS, getGoogleMapsNavigationUrl, getClosestPointOnRoute, calculateHaversineDistanceMiles } from '../../lib/routeService';
import { getOptimizedImageUrl } from '../../lib/imageOptimizer';
import { computeRegionalHubs, RegionalHubCluster, sampleSpotsEvenly } from '../../lib/spatialClusterEngine';
import { AreaSelectPayload } from './MapSearchBar';
import {
  Compass,
  ZoomIn,
  ZoomOut,
  Navigation,
  Layers,
  MapPin,
  Car,
  RotateCcw,
  Sparkles,
  ChevronDown,
  Loader2,
  Check,
  RefreshCw,
  Globe,
  Maximize2,
  Minimize2,
  Trees,
  Mountain
} from 'lucide-react';

export interface MapBounds {
  northEast: { lat: number; lng: number };
  southWest: { lat: number; lng: number };
}

export type MapTileTheme = 'voyager' | 'satellite' | 'dark';

const TILE_LAYERS: Record<MapTileTheme, { base: string; labels?: string; attribution: string }> = {
  voyager: {
    base: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &copy; OpenStreetMap',
  },
  satellite: {
    base: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    labels: 'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, Maxar, Earthstar Geographics',
  },
  dark: {
    base: 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CARTO &copy; OpenStreetMap',
  },
};

export interface LeafletInteractiveMapProps {
  allSpots: Spot[];
  visibleSpots: Spot[];
  hoveredSpotId: string | null;
  selectedSpotId: string | null;
  isolateSelectedSpot?: boolean;
  onToggleIsolateSelected?: () => void;
  onSelectSpot: (spot: Spot) => void;
  onBoundsChange?: (bounds: MapBounds) => void;
  // Uber Routing Props
  activeRoute: RouteResult | null;
  origin: RouteOrigin;
  onChangeOrigin: (origin: RouteOrigin) => void;
  isSimulatingDrive: boolean;
  onSimulationEnd?: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  className?: string;
  radiusMiles?: number | null;
  onSelectRadius?: (radius: number | null) => void;
  targetView?: { center?: [number, number]; zoom?: number; bounds?: MapBounds; timestamp: number } | null;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onSelectArea?: (payload: AreaSelectPayload) => void;
  onClearSearch?: () => void;
  activeAgencyFilter?: 'all' | 'USFS' | 'BLM';
  onChangeAgencyFilter?: (agency: 'all' | 'USFS' | 'BLM') => void;
  onNavigateToDetails?: (spotId: string) => void;
  onRequestStay?: (spot: Spot) => void;
  tripRoute?: SearchFilterState['tripRoute'];
}

export const LeafletInteractiveMap: React.FC<LeafletInteractiveMapProps> = (props) => {
  const {
    allSpots,
    visibleSpots,
    hoveredSpotId,
    selectedSpotId,
    isolateSelectedSpot,
    onToggleIsolateSelected,
    onSelectSpot,
    onBoundsChange,
    activeRoute,
    origin,
    onChangeOrigin,
    isSimulatingDrive,
    onSimulationEnd,
    isExpanded = false,
    onToggleExpand,
    className = '',
    radiusMiles = 100,
    onSelectRadius,
    targetView,
    searchQuery = '',
    onSearchChange,
    onSelectArea,
    onClearSearch,
    activeAgencyFilter = 'all',
    onChangeAgencyFilter,
    onNavigateToDetails,
    onRequestStay,
    tripRoute,
  } = props;
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);
  const labelsTileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const hubMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const originMarkerRef = useRef<L.Marker | null>(null);
  const destinationMarkerRef = useRef<L.Marker | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const routeGlowPolylineRef = useRef<L.Polyline | null>(null);
  const spurPolylinesRef = useRef<L.Polyline[]>([]);
  const spurMarkersRef = useRef<L.CircleMarker[]>([]);
  const selectedSpurGlowRef = useRef<L.Polyline | null>(null);
  const selectedSpurCoreRef = useRef<L.Polyline | null>(null);
  const selectedSpurBadgeRef = useRef<L.Marker | null>(null);
  const midBadgeMarkerRef = useRef<L.Marker | null>(null);
  const simulatedVehicleRef = useRef<L.Marker | null>(null);
  const simulationAnimationRef = useRef<number | null>(null);
  const initialFitDoneRef = useRef(false);
  const [currentZoom, setCurrentZoom] = useState<number>(6);

  // Airbnb Map Controls & Logic
  const [mapTheme, setMapTheme] = useState<MapTileTheme>('voyager');
  const [searchAsIMove, setSearchAsIMove] = useState(true);
  const [hasMovedSinceSearch, setHasMovedSinceSearch] = useState(false);
  const [showOriginMenu, setShowOriginMenu] = useState(false);
  const [showLayersMenu, setShowLayersMenu] = useState(false);
  const [isLocatingUser, setIsLocatingUser] = useState(false);

  // Spot isolation state (show spot alone on map)
  const [internalIsolate, setInternalIsolate] = useState(true);
  const isIsolated = isolateSelectedSpot !== undefined ? isolateSelectedSpot : internalIsolate;
  const toggleIsolate = useCallback(() => {
    if (onToggleIsolateSelected) {
      onToggleIsolateSelected();
    } else {
      setInternalIsolate((prev) => !prev);
    }
  }, [onToggleIsolateSelected]);

  useEffect(() => {
    if (selectedSpotId) {
      setInternalIsolate(true);
    }
  }, [selectedSpotId]);

  // Helper to get current bounds
  const getMapBounds = useCallback((): MapBounds | null => {
    if (!mapInstanceRef.current) return null;
    const b = mapInstanceRef.current.getBounds();
    const ne = b.getNorthEast();
    const sw = b.getSouthWest();
    return {
      northEast: { lat: ne.lat, lng: ne.lng },
      southWest: { lat: sw.lat, lng: sw.lng },
    };
  }, []);

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: origin.coordinates,
      zoom: 6,
      zoomControl: false,
      scrollWheelZoom: true,
      preferCanvas: true,
    });

    // Base Tile Layer
    const baseTile = L.tileLayer(TILE_LAYERS[mapTheme].base, {
      attribution: TILE_LAYERS[mapTheme].attribution,
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);
    baseTileLayerRef.current = baseTile;

    mapInstanceRef.current = map;

    // Airbnb Viewport Moveend Handler
    const handleMoveEnd = () => {
      const bounds = getMapBounds();
      if (!bounds) return;
      setCurrentZoom(map.getZoom());

      if (searchAsIMove) {
        if (onBoundsChange) onBoundsChange(bounds);
        setHasMovedSinceSearch(false);
      } else {
        setHasMovedSinceSearch(true);
      }
    };

    map.on('moveend', handleMoveEnd);

    return () => {
      map.off('moveend', handleMoveEnd);
      map.remove();
      mapInstanceRef.current = null;
      baseTileLayerRef.current = null;
      labelsTileLayerRef.current = null;
      initialFitDoneRef.current = false;
    };
  }, []);

  // Invalidate map size when expanded / collapsed
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [isExpanded]);

  // 2. Dynamic Tile Switcher (Voyager, Satellite with hybrid labels, Dark)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !baseTileLayerRef.current) return;

    const layerConfig = TILE_LAYERS[mapTheme];
    baseTileLayerRef.current.setUrl(layerConfig.base);

    // Manage Satellite hybrid road labels overlay
    if (layerConfig.labels) {
      if (!labelsTileLayerRef.current) {
        labelsTileLayerRef.current = L.tileLayer(layerConfig.labels, {
          maxZoom: 19,
          opacity: 0.85,
        }).addTo(map);
      } else {
        labelsTileLayerRef.current.setUrl(layerConfig.labels);
      }
    } else {
      if (labelsTileLayerRef.current) {
        labelsTileLayerRef.current.remove();
        labelsTileLayerRef.current = null;
      }
    }
  }, [mapTheme]);

  // 3. Render / Update Origin (Starting RV) Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (originMarkerRef.current) {
      originMarkerRef.current.remove();
      originMarkerRef.current = null;
    }

    // Uber-style vehicle origin pin
    const originIcon = L.divIcon({
      className: 'custom-camproo-marker',
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          <div style="position: absolute; width: 36px; height: 36px; border-radius: 9999px; background: rgba(255, 90, 31, 0.35); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: relative; width: 32px; height: 32px; border-radius: 9999px; background: #111827; border: 2.5px solid #FFFFFF; box-shadow: 0 4px 14px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; font-size: 14px;">
            🚐
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    const marker = L.marker(origin.coordinates, {
      icon: originIcon,
      zIndexOffset: 2000,
    }).addTo(map);

    marker.bindPopup(`
      <div style="padding: 10px 12px; font-family: -apple-system, sans-serif; font-size: 12px;">
        <div style="font-weight: 800; color: #111827;">🚐 Starting RV Location</div>
        <div style="color: #6B7280; font-size: 11px; margin-top: 2px;">${origin.name}</div>
        <div style="color: #FF5A1F; font-size: 10px; font-weight: 700; margin-top: 4px;">Driving routes calculate from here</div>
      </div>
    `);

    originMarkerRef.current = marker;
  }, [origin]);

  // 3b. Destination (Finish) Marker for Road Trips
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (destinationMarkerRef.current) {
      destinationMarkerRef.current.remove();
      destinationMarkerRef.current = null;
    }

    if (!tripRoute || !tripRoute.destination || !tripRoute.destination.coordinates) return;

    const destIcon = L.divIcon({
      className: 'custom-camproo-dest-marker',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer;">
          <div style="
            background: #0f172a;
            color: #FFFFFF;
            padding: 4px 9px;
            border-radius: 9999px;
            font-family: -apple-system, sans-serif;
            font-size: 11px;
            font-weight: 800;
            box-shadow: 0 6px 20px rgba(0,0,0,0.4);
            border: 2px solid #FF5A1F;
            display: flex;
            align-items: center;
            gap: 4px;
            white-space: nowrap;
            margin-bottom: 2px;
          ">
            <span>🏁</span>
            <span style="max-width: 140px; overflow: hidden; text-overflow: ellipsis;">${tripRoute.destination.title}</span>
          </div>
          <div style="width: 14px; height: 14px; background: #FF5A1F; border-radius: 9999px; border: 2.5px solid #FFFFFF; box-shadow: 0 2px 6px rgba(0,0,0,0.35);"></div>
        </div>
      `,
      iconSize: [160, 42],
      iconAnchor: [80, 42],
    });

    const marker = L.marker(tripRoute.destination.coordinates, {
      icon: destIcon,
      zIndexOffset: 2000,
    }).addTo(map);

    destinationMarkerRef.current = marker;
  }, [tripRoute]);

  // 3a. Manage Active Exploration Radius Radar Circle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (radiusMiles && radiusMiles > 0) {
      const radiusMeters = radiusMiles * 1609.34;
      if (!radiusCircleRef.current) {
        radiusCircleRef.current = L.circle(origin.coordinates, {
          radius: radiusMeters,
          color: '#FF5A1F',
          weight: 2,
          opacity: 0.55,
          fillColor: '#FF5A1F',
          fillOpacity: 0.05,
          dashArray: '5, 5',
        }).addTo(map);
      } else {
        radiusCircleRef.current.setLatLng(origin.coordinates);
        radiusCircleRef.current.setRadius(radiusMeters);
        radiusCircleRef.current.addTo(map);
      }
    } else {
      if (radiusCircleRef.current) {
        radiusCircleRef.current.remove();
        radiusCircleRef.current = null;
      }
    }

    return () => {
      if (radiusCircleRef.current) {
        radiusCircleRef.current.remove();
        radiusCircleRef.current = null;
      }
    };
  }, [radiusMiles, origin]);

  // 4. Initial fit bounds if no active route
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || initialFitDoneRef.current || allSpots.length === 0 || activeRoute) return;

    if (targetView) {
      initialFitDoneRef.current = true;
      return;
    }

    const bounds = L.latLngBounds([origin.coordinates]);
    allSpots.forEach(s => bounds.extend(s.coordinates));

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 6 });
      initialFitDoneRef.current = true;
    }
  }, [allSpots, origin, activeRoute, targetView]);

  // 4b. Programmatic fly-to / zoom to searched area
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !targetView) return;

    map.invalidateSize();

    if (targetView.bounds) {
      const b = targetView.bounds;
      map.fitBounds(
        [[b.southWest.lat, b.southWest.lng], [b.northEast.lat, b.northEast.lng]],
        { padding: [50, 50], maxZoom: targetView.zoom || 11 }
      );
    } else if (targetView.center) {
      map.flyTo(targetView.center, targetView.zoom || 10, { duration: 1.2 });
    }
  }, [targetView]);

  // 5. Draw / Animate Uber Route Polyline
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (routePolylineRef.current) {
      routePolylineRef.current.remove();
      routePolylineRef.current = null;
    }
    if (routeGlowPolylineRef.current) {
      routeGlowPolylineRef.current.remove();
      routeGlowPolylineRef.current = null;
    }
    if (midBadgeMarkerRef.current) {
      midBadgeMarkerRef.current.remove();
      midBadgeMarkerRef.current = null;
    }
    if (simulatedVehicleRef.current) {
      simulatedVehicleRef.current.remove();
      simulatedVehicleRef.current = null;
    }
    if (simulationAnimationRef.current) {
      cancelAnimationFrame(simulationAnimationRef.current);
      simulationAnimationRef.current = null;
    }

    if (!activeRoute || activeRoute.coordinates.length < 2) return;

    const latLngs = activeRoute.coordinates.map(c => L.latLng(c[0], c[1]));

    // Route Outer Glow
    const glowLine = L.polyline(latLngs, {
      color: '#FF5A1F',
      weight: 9,
      opacity: 0.35,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);

    // Route Core Solid Line
    const coreLine = L.polyline(latLngs, {
      color: mapTheme === 'dark' ? '#FF7A45' : '#E03D00',
      weight: 4.5,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);

    routeGlowPolylineRef.current = glowLine;
    routePolylineRef.current = coreLine;

    // Mid-route floating drive badge
    const midIndex = Math.floor(activeRoute.coordinates.length / 2);
    const midPoint = activeRoute.coordinates[midIndex];

    const badgeIcon = L.divIcon({
      className: 'custom-camproo-marker',
      html: `
        <div style="
          background: #111827;
          color: #FFFFFF;
          padding: 5px 12px;
          border-radius: 9999px;
          font-family: -apple-system, sans-serif;
          font-size: 11px;
          font-weight: 800;
          box-shadow: 0 4px 14px rgba(0,0,0,0.4);
          border: 1.5px solid #FF5A1F;
          display: flex;
          align-items: center;
          gap: 5px;
          white-space: nowrap;
          transform: translate(-50%, -50%);
        ">
          <span style="color: #FF5A1F;">🚗</span>
          <span>${activeRoute.formattedDuration}</span>
          <span style="color: #9CA3AF; font-size: 10px;">(${activeRoute.distanceMiles} mi)</span>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });

    const badgeMarker = L.marker(midPoint, { icon: badgeIcon, zIndexOffset: 1500 }).addTo(map);
    midBadgeMarkerRef.current = badgeMarker;

    // Fit route bounds with smooth animation and mobile bottom padding to clear the preview card
    const routeBounds = L.latLngBounds(latLngs);
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    map.fitBounds(routeBounds, {
      paddingTopLeft: [isMobile ? 24 : 60, isMobile ? 60 : 80],
      paddingBottomRight: [isMobile ? 24 : 60, isMobile ? 220 : 120],
      maxZoom: 12,
      animate: true,
      duration: 1.2,
    });
  }, [activeRoute, mapTheme]);

  // 5b. Draw Scenic Detour Spur Roads from Highway to Camping Havens (different color than main road)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clean up previous spur elements
    spurPolylinesRef.current.forEach((l) => l.remove());
    spurPolylinesRef.current = [];
    spurMarkersRef.current.forEach((m) => m.remove());
    spurMarkersRef.current = [];
    if (selectedSpurGlowRef.current) {
      selectedSpurGlowRef.current.remove();
      selectedSpurGlowRef.current = null;
    }
    if (selectedSpurCoreRef.current) {
      selectedSpurCoreRef.current.remove();
      selectedSpurCoreRef.current = null;
    }
    if (selectedSpurBadgeRef.current) {
      selectedSpurBadgeRef.current.remove();
      selectedSpurBadgeRef.current = null;
    }

    const routeCoords = activeRoute?.coordinates || tripRoute?.routeCoordinates;
    if (!routeCoords || routeCoords.length < 2) return;

    const spotsList = visibleSpots && visibleSpots.length > 0 ? visibleSpots : allSpots;
    const roadTripSpots = spotsList.filter((s) => (s as any).routeStopIndex !== undefined);

    if (roadTripSpots.length === 0) return;

    const targetSelectedSpot = selectedSpotId
      ? roadTripSpots.find((s) => s.id === selectedSpotId) ||
        allSpots.find((s) => s.id === selectedSpotId)
      : null;

    // 1. Draw dashed spur roads to each visible road trip stop
    roadTripSpots.forEach((spot) => {
      const isTarget = spot.id === selectedSpotId;
      if (isTarget) return;

      const turnoff =
        (spot as any).routeIntersectionCoords ||
        getClosestPointOnRoute(spot.coordinates, routeCoords);

      const latLngs = [
        L.latLng(turnoff[0], turnoff[1]),
        L.latLng(spot.coordinates[0], spot.coordinates[1]),
      ];

      const poly = L.polyline(latLngs, {
        color: '#059669', // Emerald Green - distinct from #FF5A1F orange highway
        dashArray: '5, 7',
        weight: 2.5,
        opacity: 0.85,
        lineCap: 'round',
      }).addTo(map);
      spurPolylinesRef.current.push(poly);

      const dot = L.circleMarker([turnoff[0], turnoff[1]], {
        radius: 3.5,
        fillColor: '#059669',
        fillOpacity: 1,
        color: '#FFFFFF',
        weight: 1.5,
      }).addTo(map);
      spurMarkersRef.current.push(dot);
    });

    // 2. Draw elevated, prominent spur road for the Selected Spot
    if (targetSelectedSpot) {
      const turnoff =
        (targetSelectedSpot as any).routeIntersectionCoords ||
        getClosestPointOnRoute(targetSelectedSpot.coordinates, routeCoords);

      const latLngs = [
        L.latLng(turnoff[0], turnoff[1]),
        L.latLng(targetSelectedSpot.coordinates[0], targetSelectedSpot.coordinates[1]),
      ];

      const glow = L.polyline(latLngs, {
        color: '#10B981',
        weight: 8,
        opacity: 0.5,
        lineCap: 'round',
      }).addTo(map);
      selectedSpurGlowRef.current = glow;

      const core = L.polyline(latLngs, {
        color: '#047857',
        weight: 4,
        opacity: 1,
        lineCap: 'round',
      }).addTo(map);
      selectedSpurCoreRef.current = core;

      const turnoffMarker = L.circleMarker([turnoff[0], turnoff[1]], {
        radius: 5,
        fillColor: '#10B981',
        fillOpacity: 1,
        color: '#FFFFFF',
        weight: 2,
      }).addTo(map);
      spurMarkersRef.current.push(turnoffMarker);

      // Midpoint badge
      const midLat = (turnoff[0] + targetSelectedSpot.coordinates[0]) / 2;
      const midLng = (turnoff[1] + targetSelectedSpot.coordinates[1]) / 2;
      const detourDist =
        (targetSelectedSpot as any).distanceToRoute ??
        (targetSelectedSpot as any).distanceMiles ??
        calculateHaversineDistanceMiles(turnoff, targetSelectedSpot.coordinates);

      const formattedDist = detourDist < 1 ? '< 1' : detourDist.toFixed(1);

      const badgeIcon = L.divIcon({
        className: 'custom-detour-badge',
        html: `
          <div style="
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #065F46 0%, #047857 100%);
            color: #FFFFFF;
            padding: 2.5px 8px;
            border-radius: 9999px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 9.5px;
            font-weight: 800;
            box-shadow: 0 4px 12px rgba(6, 95, 70, 0.45);
            border: 1.5px solid #FFFFFF;
            display: flex;
            align-items: center;
            gap: 4px;
            white-space: nowrap;
            pointer-events: none;
          ">
            <span>🛣️ ${formattedDist} mi detour</span>
          </div>
        `,
      });

      const badgeMarker = L.marker([midLat, midLng], {
        icon: badgeIcon,
        interactive: false,
        zIndexOffset: 125,
      }).addTo(map);
      selectedSpurBadgeRef.current = badgeMarker;
    }
  }, [
    activeRoute,
    tripRoute,
    visibleSpots,
    allSpots,
    selectedSpotId,
    hoveredSpotId,
  ]);

  // 6. Handle Vehicle Drive Simulation Animation
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !activeRoute || !isSimulatingDrive || activeRoute.coordinates.length < 2) {
      if (simulatedVehicleRef.current) {
        simulatedVehicleRef.current.remove();
        simulatedVehicleRef.current = null;
      }
      if (simulationAnimationRef.current) {
        cancelAnimationFrame(simulationAnimationRef.current);
        simulationAnimationRef.current = null;
      }
      return;
    }

    const coords = activeRoute.coordinates;
    const vehicleIcon = L.divIcon({
      className: 'custom-camproo-marker',
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 34px; height: 34px; border-radius: 9999px; background: #FF5A1F; opacity: 0.35; animation: ping 1s infinite;"></div>
          <div style="width: 32px; height: 32px; border-radius: 9999px; background: #FF5A1F; border: 2px solid #FFFFFF; box-shadow: 0 4px 14px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; font-size: 16px;">
            🚐
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const vehicleMarker = L.marker(coords[0], {
      icon: vehicleIcon,
      zIndexOffset: 3000,
    }).addTo(map);
    simulatedVehicleRef.current = vehicleMarker;

    let currentIndex = 0;
    const totalPoints = coords.length;
    const intervalMs = Math.max(25, Math.floor(8000 / totalPoints));
    let lastTime = performance.now();

    const animateVehicle = (time: number) => {
      if (time - lastTime >= intervalMs) {
        lastTime = time;
        currentIndex++;
        if (currentIndex >= totalPoints) {
          if (onSimulationEnd) onSimulationEnd();
          return;
        }
        const point = coords[currentIndex];
        vehicleMarker.setLatLng(point);
      }
      simulationAnimationRef.current = requestAnimationFrame(animateVehicle);
    };

    simulationAnimationRef.current = requestAnimationFrame(animateVehicle);

    return () => {
      if (simulationAnimationRef.current) {
        cancelAnimationFrame(simulationAnimationRef.current);
        simulationAnimationRef.current = null;
      }
      if (simulatedVehicleRef.current) {
        simulatedVehicleRef.current.remove();
        simulatedVehicleRef.current = null;
      }
    };
  }, [isSimulatingDrive, activeRoute, onSimulationEnd]);

  // Regional Hubs Calculation for Macro-Scale (zoomed out nationwide)
  const regionalHubs = useMemo(() => computeRegionalHubs(allSpots), [allSpots]);
  const isMacroZoom = currentZoom < 7 && (!radiusMiles || radiusMiles > 250);

  // 6a. Render Regional Hub Markers in Leaflet at macro scale
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!isMacroZoom) {
      hubMarkersRef.current.forEach((m) => m.remove());
      hubMarkersRef.current.clear();
      return;
    }

    const currentHubIds = new Set(regionalHubs.map((h) => h.id));
    hubMarkersRef.current.forEach((m, id) => {
      if (!currentHubIds.has(id)) {
        m.remove();
        hubMarkersRef.current.delete(id);
      }
    });

    regionalHubs.forEach((hub) => {
      if (!hubMarkersRef.current.has(hub.id)) {
        const icon = L.divIcon({
          className: 'custom-hub-marker',
          html: `
            <div style="
              display: inline-flex;
              align-items: center;
              gap: 4.5px;
              padding: 3.5px 8px;
              border-radius: 9999px;
              background: #FFFFFF;
              color: #0f172a;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              font-size: 11px;
              font-weight: 800;
              box-shadow: 0 3px 10px rgba(0,0,0,0.14), 0 1px 3px rgba(0,0,0,0.06);
              border: 1.5px solid #FF5A1F;
              white-space: nowrap;
              cursor: pointer;
              transition: transform 0.15s ease;
            ">
              <span style="font-size: 12.5px;">${hub.icon}</span>
              <span style="
                color: #FF5A1F;
                font-weight: 900;
                font-size: 10.5px;
                letter-spacing: -0.2px;
              ">${hub.count.toLocaleString()}</span>
            </div>
          `,
          iconSize: [60, 28],
          iconAnchor: [30, 14],
        });

        const marker = L.marker(hub.coordinates, { icon }).addTo(map);
        marker.on('click', () => {
          map.setView(hub.coordinates, 8);
        });
        hubMarkersRef.current.set(hub.id, marker);
      }
    });
  }, [isMacroZoom, regionalHubs]);

  // 7. Authentic Airbnb Spot Markers with Smart 30-Cap and Diffing
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (isMacroZoom) {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current.clear();
      return;
    }

    let spotsToRender: Spot[] = [];
    if (selectedSpotId && isIsolated) {
      const selected = allSpots.find((s) => s.id === selectedSpotId);
      spotsToRender = selected ? [selected] : [];
    } else {
      const bounds = getMapBounds();
      const MAX_VISIBLE_MARKERS = 30;
      spotsToRender = sampleSpotsEvenly(visibleSpots, MAX_VISIBLE_MARKERS, bounds);

      if (selectedSpotId && !spotsToRender.some((s) => s.id === selectedSpotId)) {
        const selected = visibleSpots.find((s) => s.id === selectedSpotId);
        if (selected) spotsToRender.push(selected);
      }
      if (hoveredSpotId && !spotsToRender.some((s) => s.id === hoveredSpotId)) {
        const hovered = visibleSpots.find((s) => s.id === hoveredSpotId);
        if (hovered) spotsToRender.push(hovered);
      }
    }

    // Fast Diffing: remove markers no longer in view
    const newSpotIds = new Set(spotsToRender.map((s) => s.id));
    markersRef.current.forEach((marker, id) => {
      if (!newSpotIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    spotsToRender.forEach((spot) => {
      const isHovered = hoveredSpotId === spot.id;
      const isSelected = selectedSpotId === spot.id;
      const googleUrl = getGoogleMapsNavigationUrl(origin.coordinates, spot.coordinates, spot.title);

      const stopIdx = (spot as any).routeStopIndex;
      const etaText = (spot as any).arrivalTimeFormatted ? ` · ETA ${(spot as any).arrivalTimeFormatted}` : '';

      const isRoadTripStop = Boolean(stopIdx);

      const titleBadge = (isSelected || (isHovered && isRoadTripStop)) ? `
        <div style="
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%) translateY(-6px);
          background: rgba(15, 23, 42, 0.96);
          backdrop-filter: blur(12px);
          color: #FFFFFF;
          padding: 4px 9px;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.35);
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
          border: 1px solid rgba(255,255,255,0.18);
          z-index: 1000;
          pointer-events: auto;
        ">
          ${stopIdx ? `<span style="background: linear-gradient(135deg, #FF5A1F, #D97706); color: #FFFFFF; padding: 1px 6px; border-radius: 6px; font-size: 10px; font-weight: 900;">#${stopIdx}</span>` : ''}
          <span style="font-size: 11px; font-weight: 800; max-width: 150px; overflow: hidden; text-overflow: ellipsis;">${spot.title}${etaText}</span>
          <button class="spot-details-action" data-spot-id="${spot.id}" style="
            background: #FF5A1F;
            color: #FFFFFF;
            padding: 2px 7px;
            border-radius: 6px;
            font-size: 10px;
            font-weight: 800;
            border: none;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 2px;
          ">
            <span>View Details →</span>
          </button>
          <a href="${googleUrl}" target="_blank" rel="noopener noreferrer" style="
            background: #2563EB;
            color: #FFFFFF;
            padding: 2px 6px;
            border-radius: 6px;
            font-size: 10px;
            font-weight: 700;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 2px;
          " onclick="event.stopPropagation();">
            <span>GPS ↗</span>
          </a>
        </div>
      ` : '';

      // High-contrast Road Trip Pin vs Standard Map Pin
      let markerPillContent = '';
      if (isRoadTripStop) {
        const pillBg = isSelected
          ? 'linear-gradient(135deg, #FF5A1F 0%, #EA580C 100%)'
          : isHovered
          ? '#0F172A'
          : '#FFFFFF';
        const pillText = isSelected || isHovered ? '#FFFFFF' : '#0F172A';
        const pillBorder = isSelected ? '#FFFFFF' : isHovered ? '#FF5A1F' : '#059669';
        const pillShadow = isSelected
          ? '0 0 0 3px rgba(255, 90, 31, 0.45), 0 8px 24px rgba(255, 90, 31, 0.5)'
          : isHovered
          ? '0 0 0 2px rgba(15, 23, 42, 0.35), 0 6px 18px rgba(0,0,0,0.25)'
          : '0 0 0 2px rgba(5, 150, 105, 0.25), 0 4px 14px rgba(0,0,0,0.18)';

        const detourBadge = (spot as any).distanceToRoute !== undefined
          ? `<span style="background: ${isSelected ? 'rgba(255,255,255,0.2)' : '#ECFDF5'}; color: ${isSelected ? '#FFFFFF' : '#047857'}; padding: 1px 5px; border-radius: 6px; font-weight: 800; font-size: 9px;">${(spot as any).distanceToRoute < 1 ? '<1' : (spot as any).distanceToRoute}mi</span>`
          : `<span style="font-size: 9.5px; opacity: 0.9;">${spot.rigCompatibility.maxLengthFt}ft</span>`;

        const showTitle = isSelected || isHovered;
        const titleMarkup = showTitle
          ? `<span style="font-size: 11px; font-weight: 800; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${spot.title}</span>`
          : '';

        markerPillContent = `
          <div style="
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: ${isSelected ? '4.5px 10px' : '2.5px 6.5px'};
            border-radius: 9999px;
            background: ${pillBg};
            color: ${pillText};
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 11px;
            font-weight: 800;
            box-shadow: ${pillShadow};
            border: 1.5px solid ${pillBorder};
            white-space: nowrap;
            transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          ">
            <span style="background: ${isSelected ? 'rgba(255,255,255,0.25)' : 'linear-gradient(135deg, #FF5A1F, #D97706)'}; color: #FFFFFF; padding: 1.5px 5.5px; border-radius: 9999px; font-weight: 900; font-size: 10px; letter-spacing: 0.2px; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">#${stopIdx}</span>
            ${titleMarkup}
            ${detourBadge}
          </div>
        `;
      } else {
        const bg = isSelected ? '#FF5A1F' : isHovered ? '#0f172a' : '#FFFFFF';
        const color = isSelected || isHovered ? '#FFFFFF' : '#0f172a';
        const badgeBg = isSelected ? 'rgba(255,255,255,0.25)' : '#FF5A1F';
        const shadow = isSelected
          ? '0 6px 20px rgba(255, 90, 31, 0.4)'
          : isHovered
          ? '0 6px 18px rgba(0,0,0,0.25)'
          : '0 2px 8px rgba(0,0,0,0.08)';
        const border = isSelected ? '#FF5A1F' : isHovered ? '#0f172a' : 'rgba(0,0,0,0.08)';

        const isCompact = currentZoom < 8 && !isSelected && !isHovered && !isRoadTripStop;

        if (isCompact) {
          markerPillContent = `
            <div style="
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 24px;
              height: 24px;
              border-radius: 9999px;
              background-color: ${bg};
              color: ${color};
              box-shadow: ${shadow};
              border: 1.5px solid ${border};
            ">
              <span style="font-size: 12px; line-height: 1;">⛺</span>
            </div>
          `;
        } else {
          markerPillContent = `
            <div style="
              display: inline-flex;
              align-items: center;
              gap: 5px;
              padding: ${isSelected ? '5px 10px' : '3px 8px'};
              border-radius: 9999px;
              background-color: ${bg};
              color: ${color};
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              font-size: 11px;
              font-weight: 700;
              box-shadow: ${shadow};
              border: 1px solid ${border};
              white-space: nowrap;
            ">
              <span style="background: ${badgeBg}; color: #FFFFFF; padding: 1px 5px; border-radius: 9999px; font-weight: 800; font-size: 9.5px;">$0</span>
              <span style="font-size: 10.5px; opacity: 0.95; font-weight: 600;">${spot.rigCompatibility.maxLengthFt}ft</span>
            </div>
          `;
        }
      }

      const scale = isSelected || isHovered ? 'scale(1.12)' : 'scale(1)';
      const markerZIndex = isHovered || isSelected ? 999 : (isRoadTripStop ? 600 + Math.min(Number(stopIdx), 200) : 1);
      const isCompact = currentZoom < 8 && !isSelected && !isHovered && !isRoadTripStop;

      const customIcon = L.divIcon({
        className: 'custom-camproo-marker',
        html: `
          <div style="cursor: pointer; transform: ${scale}; z-index: ${markerZIndex}; transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1);">
            ${titleBadge}
            ${markerPillContent}
          </div>
        `,
        iconSize: isRoadTripStop ? [140, 36] : isCompact ? [28, 28] : [88, 34],
        iconAnchor: isRoadTripStop ? [70, 18] : isCompact ? [14, 14] : [44, 17],
      });

      const existing = markersRef.current.get(spot.id);
      if (existing) {
        existing.setIcon(customIcon);
        existing.setZIndexOffset(markerZIndex);
      } else {
        const marker = L.marker(spot.coordinates, { icon: customIcon, zIndexOffset: markerZIndex }).addTo(map);

        marker.on('click', () => {
          if (selectedSpotId === spot.id && onNavigateToDetails) {
            onNavigateToDetails(spot.id);
          } else {
            onSelectSpot(spot);
          }
        });

        markersRef.current.set(spot.id, marker);
      }
    });
  }, [visibleSpots, hoveredSpotId, selectedSpotId, onSelectSpot, isMacroZoom, isIsolated, allSpots, onNavigateToDetails]);

  // Delegated click on container for spot details button
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container || !onNavigateToDetails) return;
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('.spot-details-action');
      if (target) {
        e.stopPropagation();
        e.preventDefault();
        const spotId = target.getAttribute('data-spot-id');
        if (spotId) {
          onNavigateToDetails(spotId);
        }
      }
    };
    container.addEventListener('click', handleClick);
    return () => {
      container.removeEventListener('click', handleClick);
    };
  }, [onNavigateToDetails]);

  // Smoothly center on selected spot
  useEffect(() => {
    if (!selectedSpotId || !mapInstanceRef.current) return;
    const spot = allSpots.find((s) => s.id === selectedSpotId);
    if (!spot) return;
    if (!activeRoute) {
      mapInstanceRef.current.setView(spot.coordinates, 12, { animate: true });
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setTimeout(() => {
          mapInstanceRef.current?.panBy([0, 80], { animate: true });
        }, 200);
      }
    }
  }, [selectedSpotId, allSpots, activeRoute]);

  // Bring hovered marker to front
  useEffect(() => {
    if (!hoveredSpotId || !mapInstanceRef.current) return;
    const marker = markersRef.current.get(hoveredSpotId);
    if (marker) {
      marker.setZIndexOffset(1000);
    }
  }, [hoveredSpotId]);

  // Airbnb Manual "Search this area" handler
  const handleManualSearchArea = () => {
    const bounds = getMapBounds();
    if (bounds && onBoundsChange) {
      onBoundsChange(bounds);
      setHasMovedSinceSearch(false);
    }
  };

  // GPS User Geolocation
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocatingUser(false);
        const newOrigin: RouteOrigin = {
          name: 'My Live GPS Location',
          coordinates: [pos.coords.latitude, pos.coords.longitude],
        };
        onChangeOrigin(newOrigin);
        setShowOriginMenu(false);
        mapInstanceRef.current?.flyTo(newOrigin.coordinates, 10, { duration: 1.5 });
      },
      (err) => {
        setIsLocatingUser(false);
        alert('Could not retrieve GPS location. Using preset hub.');
      },
      { timeout: 8000 }
    );
  };

  const handleResetToAllUS = () => {
    const map = mapInstanceRef.current;
    if (!map || allSpots.length === 0) return;

    const bounds = L.latLngBounds([origin.coordinates]);
    allSpots.forEach(s => bounds.extend(s.coordinates));
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 6 });
      const currentBounds = getMapBounds();
      if (currentBounds && onBoundsChange) {
        onBoundsChange(currentBounds);
      }
      if (onClearSearch) {
        onClearSearch();
      }
      setHasMovedSinceSearch(false);
    }
  };

  return (
    <div className={`relative rounded-3xl overflow-hidden shadow-airbnb border border-dark-200 bg-white ${className}`}>
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[460px]" />

      {/* Top Center: Minimalist Map Quick Filter Strip (desktop only, hidden on mobile or when viewing single spot) */}
      {!isolateSelectedSpot && (
        <div className="hidden md:flex absolute top-3 inset-x-0 mx-auto w-full max-w-2xl px-3 justify-center z-[400] pointer-events-none">
        {/* Horizontal Quick Filter & Auto-Search Strip */}
        <div className="pointer-events-auto flex items-center flex-nowrap touch-pan-x gap-1.5 overflow-x-auto no-scrollbar py-0.5 px-1 max-w-full">
          {hasMovedSinceSearch && !searchAsIMove ? (
            <button
              onClick={handleManualSearchArea}
              className="bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black text-roo-600 border border-roo-200 flex items-center gap-1.5 shadow-sm hover:bg-white active:scale-95 transition-all shrink-0"
            >
              <RefreshCw className="w-3 h-3 text-roo-500 animate-spin" />
              <span>Search this area</span>
            </button>
          ) : (
            <button
              onClick={() => {
                const next = !searchAsIMove;
                setSearchAsIMove(next);
                if (next) {
                  const bounds = getMapBounds();
                  if (bounds && onBoundsChange) onBoundsChange(bounds);
                }
              }}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all shadow-2xs border shrink-0 flex items-center gap-1.5 ${
                searchAsIMove
                  ? 'bg-white/95 backdrop-blur-md text-dark-900 border-dark-200'
                  : 'bg-white/70 backdrop-blur-md text-dark-500 border-dark-200/50 hover:bg-white'
              }`}
            >
              <div className={`w-3 h-3 rounded-xs border flex items-center justify-center ${
                searchAsIMove ? 'bg-dark-900 border-dark-900 text-white' : 'border-dark-400 bg-white'
              }`}>
                {searchAsIMove && <Check className="w-2 h-2 stroke-[3]" />}
              </div>
              <span className="hidden sm:inline">Search as I move</span>
              <span className="sm:hidden">Auto-search</span>
            </button>
          )}

          {/* Agency Filter Chips */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onChangeAgencyFilter?.('all');
            }}
            className={`px-3 py-1 rounded-full text-[11px] font-extrabold transition-all shadow-2xs border shrink-0 flex items-center gap-1 ${
              activeAgencyFilter === 'all'
                ? 'bg-dark-900 text-white border-dark-900 shadow-xs'
                : 'bg-white/95 backdrop-blur-md text-dark-700 hover:text-dark-950 border-dark-200'
            }`}
          >
            <Sparkles className="w-3 h-3 text-roo-400" />
            <span>All Agencies</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onChangeAgencyFilter?.('USFS');
            }}
            className={`px-3 py-1 rounded-full text-[11px] font-extrabold transition-all shadow-2xs border shrink-0 flex items-center gap-1 ${
              activeAgencyFilter === 'USFS'
                ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                : 'bg-white/95 backdrop-blur-md text-dark-700 hover:text-dark-950 border-dark-200'
            }`}
          >
            <Trees className="w-3 h-3 text-emerald-500" />
            <span>USFS (9.3k)</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onChangeAgencyFilter?.('BLM');
            }}
            className={`px-3 py-1 rounded-full text-[11px] font-extrabold transition-all shadow-2xs border shrink-0 flex items-center gap-1 ${
              activeAgencyFilter === 'BLM'
                ? 'bg-amber-700 text-white border-amber-700 shadow-xs'
                : 'bg-white/95 backdrop-blur-md text-dark-700 hover:text-dark-950 border-dark-200'
            }`}
          >
            <Mountain className="w-3 h-3 text-amber-500" />
            <span>BLM (464)</span>
          </button>

          {/* Origin Picker Pill */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowOriginMenu(!showOriginMenu)}
              className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/95 backdrop-blur-md text-dark-800 hover:text-dark-950 border border-dark-200 shadow-2xs flex items-center gap-1.5"
            >
              <span>🚐</span>
              <span className="truncate max-w-[80px] sm:max-w-[120px]">{origin.name.replace('Live GPS Location', 'Live GPS')}</span>
              <ChevronDown className="w-3 h-3 text-dark-500" />
            </button>

            {showOriginMenu && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-white/95 backdrop-blur-xl border border-dark-200 rounded-2xl shadow-xl p-2 z-50 divide-y divide-dark-100">
                <div className="p-1">
                  <button
                    onClick={handleUseCurrentLocation}
                    disabled={isLocatingUser}
                    className="w-full text-left px-3 py-2 rounded-xl bg-roo-50 hover:bg-roo-100 text-roo-700 font-extrabold text-xs flex items-center gap-2 transition-colors"
                  >
                    <Navigation className={`w-3.5 h-3.5 text-roo-500 ${isLocatingUser ? 'animate-spin' : ''}`} />
                    <span>{isLocatingUser ? 'Acquiring GPS...' : 'Use My Live GPS'}</span>
                  </button>
                </div>

                <div className="p-1 space-y-0.5">
                  <div className="px-3 py-1 text-[9px] font-black uppercase tracking-wider text-dark-400">
                    Popular Starting Hubs
                  </div>
                  {DEFAULT_ORIGINS.map((orig) => (
                    <button
                      key={orig.name}
                      onClick={() => {
                        onChangeOrigin(orig);
                        setShowOriginMenu(false);
                        mapInstanceRef.current?.flyTo(orig.coordinates, 8, { duration: 1.2 });
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-between ${
                        origin.name === orig.name ? 'bg-dark-900 text-white' : 'text-dark-800 hover:bg-dark-100'
                      }`}
                    >
                      <span>{orig.name}</span>
                      {origin.name === orig.name && <span className="text-[10px]">✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      )}

      {/* Floating Status: Spot Alone on Map (only shown when not on single spot view) */}
      {selectedSpotId && !isolateSelectedSpot && (
        <div className="absolute top-24 sm:top-24 left-1/2 -translate-x-1/2 z-[400] bg-white/95 backdrop-blur-md px-3.5 py-1 rounded-full shadow-md border border-dark-200 text-xs font-bold flex items-center gap-2 pointer-events-auto">
          <span className="w-2 h-2 rounded-full bg-roo-500 animate-pulse" />
          <span className="text-dark-900 text-[11px]">
            {isIsolated ? 'Viewing spot alone on map' : 'Showing all spots'}
          </span>
          <button
            onClick={toggleIsolate}
            className="text-roo-600 hover:text-roo-700 underline text-[11px] font-black ml-1 cursor-pointer"
          >
            {isIsolated ? 'Show all' : 'Isolate'}
          </button>
        </div>
      )}

      {/* Bottom Right: Consolidated Minimalist Map Control Stack */}
      <div className="absolute bottom-5 right-3 sm:right-4 z-[400] flex flex-col items-center gap-1.5 pointer-events-auto">
        {/* Fullscreen Toggle */}
        {onToggleExpand && (
          <button
            onClick={onToggleExpand}
            title={isExpanded ? 'Minimize Map View' : 'Expand Map'}
            className="hidden sm:flex p-2.5 rounded-2xl bg-white/95 backdrop-blur-md text-dark-800 hover:text-dark-950 hover:bg-white shadow-md border border-dark-200/80 transition-all items-center justify-center"
          >
            {isExpanded ? (
              <Minimize2 className="w-4 h-4 text-roo-500" />
            ) : (
              <Maximize2 className="w-4 h-4 text-roo-500" />
            )}
          </button>
        )}

        {/* Map Layers Style Popover */}
        <div className="relative">
          <button
            onClick={() => setShowLayersMenu(!showLayersMenu)}
            className={`p-2.5 rounded-2xl transition-all shadow-md flex items-center justify-center border ${
              showLayersMenu
                ? 'bg-dark-900 text-white border-dark-900'
                : 'bg-white/95 backdrop-blur-md text-dark-800 hover:text-dark-950 hover:bg-white border-dark-200/80'
            }`}
            title="Map Layers"
          >
            <Layers className="w-4 h-4" />
          </button>
          {showLayersMenu && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-0 right-12 mb-0 bg-white/95 backdrop-blur-xl border border-dark-200 rounded-2xl shadow-xl p-1.5 flex flex-col gap-1 min-w-[120px] animate-fade-in"
            >
              <button
                onClick={() => { setMapTheme('voyager'); setShowLayersMenu(false); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold text-left flex items-center gap-2 transition-colors ${mapTheme === 'voyager' ? 'bg-dark-900 text-white' : 'hover:bg-dark-100 text-dark-800'}`}
              >
                <span>🗺️ Map</span>
              </button>
              <button
                onClick={() => { setMapTheme('satellite'); setShowLayersMenu(false); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold text-left flex items-center gap-2 transition-colors ${mapTheme === 'satellite' ? 'bg-dark-900 text-white' : 'hover:bg-dark-100 text-dark-800'}`}
              >
                <span>🛰️ Satellite</span>
              </button>
              <button
                onClick={() => { setMapTheme('dark'); setShowLayersMenu(false); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold text-left flex items-center gap-2 transition-colors ${mapTheme === 'dark' ? 'bg-dark-900 text-white' : 'hover:bg-dark-100 text-dark-800'}`}
              >
                <span>🌙 Dark</span>
              </button>
            </div>
          )}
        </div>

        {/* GPS Near Me */}
        <button
          onClick={handleUseCurrentLocation}
          disabled={isLocatingUser}
          className="p-2.5 rounded-2xl bg-white/95 backdrop-blur-md text-blue-600 hover:text-blue-700 hover:bg-white border border-dark-200/80 shadow-md transition-all flex items-center justify-center active:scale-95"
          title="Locate my position"
        >
          {isLocatingUser ? (
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          ) : (
            <Navigation className="w-4 h-4 fill-blue-600" />
          )}
        </button>

        {/* Compass / Reset USA */}
        <button
          onClick={handleResetToAllUS}
          title="Reset to whole US"
          className="hidden sm:flex p-2.5 rounded-2xl bg-white/95 backdrop-blur-md text-dark-800 hover:text-dark-950 hover:bg-white border border-dark-200/80 shadow-md transition-all items-center justify-center group"
        >
          <Compass className="w-4 h-4 text-roo-500 group-hover:rotate-45 transition-transform duration-300" />
        </button>

        {/* Zoom Controls (hidden on mobile, pinch-to-zoom is standard) */}
        <div className="hidden sm:flex bg-white/95 backdrop-blur-md rounded-2xl border border-dark-200/80 shadow-md overflow-hidden flex-col divide-y divide-dark-100">
          <button
            onClick={() => mapInstanceRef.current?.zoomIn()}
            title="Zoom In"
            className="p-2 text-dark-800 hover:text-dark-950 hover:bg-dark-50 transition-colors flex items-center justify-center"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => mapInstanceRef.current?.zoomOut()}
            title="Zoom Out"
            className="p-2 text-dark-800 hover:text-dark-950 hover:bg-dark-50 transition-colors flex items-center justify-center"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
