import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { Spot, SearchFilterState } from '../../types';
import { RouteOrigin, RouteResult, DEFAULT_ORIGINS, getGoogleMapsNavigationUrl, getClosestPointOnRoute, calculateHaversineDistanceMiles } from '../../lib/routeService';
import { getOptimizedImageUrl } from '../../lib/imageOptimizer';
import { LeafletInteractiveMap, MapBounds } from './LeafletInteractiveMap';
import { computeRegionalHubs, RegionalHubCluster, sampleSpotsEvenly } from '../../lib/spatialClusterEngine';
import { AreaSelectPayload } from './MapSearchBar';
import {
  Compass,
  ZoomIn,
  ZoomOut,
  Navigation,
  RefreshCw,
  Check,
  ChevronDown,
  Loader2,
  Maximize2,
  Minimize2,
  Mountain,
  Satellite,
  Map as MapIcon,
  Moon,
  Trees,
  Star,
  Truck,
  Sparkles,
  X,
  ExternalLink,
  Layers
} from 'lucide-react';

export type GoogleMapTheme = 'roadmap' | 'satellite' | 'terrain' | 'dark';

const CLEAN_MINIMAL_GOOGLE_MAPS_STYLE: google.maps.MapTypeStyle[] = [
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'transit',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text',
    stylers: [{ visibility: 'off' }],
  },
];

const GOOGLE_DARK_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'transit',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }]
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#263c3f' }]
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6b9a76' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#38414e' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#212a37' }]
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9ca5b3' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#746855' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1f2835' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#f3d19c' }]
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#2f3948' }]
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }]
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#17263c' }]
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#515c6d' }]
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#17263c' }]
  }
];

export interface GoogleInteractiveMapProps {
  allSpots: Spot[];
  visibleSpots: Spot[];
  hoveredSpotId: string | null;
  selectedSpotId: string | null;
  isolateSelectedSpot?: boolean;
  onToggleIsolateSelected?: () => void;
  onSelectSpot: (spot: Spot) => void;
  onBoundsChange?: (bounds: MapBounds) => void;
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

export const GoogleInteractiveMap: React.FC<GoogleInteractiveMapProps> = (props) => {
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
    onNavigateToDetails,
    onRequestStay,
    tripRoute,
  } = props;

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Overlay pool for fast diffing
  const overlaysRef = useRef<Map<string, google.maps.OverlayView>>(new Map());
  const hubOverlaysRef = useRef<Map<string, google.maps.OverlayView>>(new Map());
  const originOverlayRef = useRef<google.maps.OverlayView | null>(null);
  const destinationOverlayRef = useRef<google.maps.OverlayView | null>(null);
  const radiusCircleRef = useRef<google.maps.Circle | null>(null);
  const midBadgeOverlayRef = useRef<google.maps.OverlayView | null>(null);
  const simulatedVehicleOverlayRef = useRef<google.maps.OverlayView | null>(null);
  const simulationAnimationRef = useRef<number | null>(null);
  const routePolylineRef = useRef<google.maps.Polyline | null>(null);
  const routeGlowPolylineRef = useRef<google.maps.Polyline | null>(null);
  const spurLinesRef = useRef<google.maps.Polyline[]>([]);
  const spurDotsRef = useRef<google.maps.Circle[]>([]);
  const selectedSpurGlowRef = useRef<google.maps.Polyline | null>(null);
  const selectedSpurCoreRef = useRef<google.maps.Polyline | null>(null);
  const selectedSpurBadgeRef = useRef<google.maps.OverlayView | null>(null);
  const initialFitDoneRef = useRef(false);
  const idleDebounceTimerRef = useRef<any>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(6);

  // UI States
  const [mapTheme, setMapTheme] = useState<GoogleMapTheme>('roadmap');
  const [searchAsIMove, setSearchAsIMove] = useState(true);
  const [hasMovedSinceSearch, setHasMovedSinceSearch] = useState(false);
  const [showOriginMenu, setShowOriginMenu] = useState(false);
  const [showLayersMenu, setShowLayersMenu] = useState(false);
  const [isLocatingUser, setIsLocatingUser] = useState(false);
  const [activeChip, setActiveChip] = useState<'all' | 'usfs' | 'blm' | 'bigrig' | 'top'>('all');
  const [previewSpot, setPreviewSpot] = useState<Spot | null>(null);

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

  // Reset isolation to true when a new spot is selected
  useEffect(() => {
    if (selectedSpotId) {
      setInternalIsolate(true);
    }
  }, [selectedSpotId]);

  // Bounds state
  const [currentBounds, setCurrentBounds] = useState<MapBounds | null>(null);

  // Helper to extract bounds
  const getMapBounds = useCallback((): MapBounds | null => {
    if (!mapInstanceRef.current) return null;
    const b = mapInstanceRef.current.getBounds();
    if (!b) return null;
    const ne = b.getNorthEast();
    const sw = b.getSouthWest();
    return {
      northEast: { lat: ne.lat(), lng: ne.lng() },
      southWest: { lat: sw.lat(), lng: sw.lng() },
    };
  }, []);

  // 1. Load Google Maps JS API and catch auth errors
  useEffect(() => {
    if (!apiKey) {
      setLoadError('No API key provided');
      return;
    }

    (window as any).gm_authFailure = () => {
      console.warn('Google Maps gm_authFailure triggered: falling back to Leaflet map.');
      setLoadError('Google Maps API key rejected. Using high-speed OpenStreetMap fallback.');
    };

    try {
      setOptions({
        key: apiKey,
        v: 'weekly',
      });

      Promise.all([
        importLibrary('maps'),
        importLibrary('geometry'),
      ])
        .then(() => {
          setIsGoogleLoaded(true);
        })
        .catch((err: any) => {
          console.warn('Google Maps failed to load, falling back to Leaflet:', err);
          setLoadError(err?.message || 'Google Maps failed to load');
        });
    } catch (err: any) {
      console.warn('Google Maps loader initialization error:', err);
      setLoadError(err?.message || 'Google Maps init error');
    }
  }, [apiKey]);

  // If loading failed or gm_authFailure occurred or no API key, render Leaflet map directly
  if (loadError || !apiKey) {
    return (
      <div className="relative w-full h-full">
        <LeafletInteractiveMap {...props} />
      </div>
    );
  }

  // 2. Initialize Google Map
  useEffect(() => {
    if (!isGoogleLoaded || !mapContainerRef.current || mapInstanceRef.current) return;

    try {
      const map = new google.maps.Map(mapContainerRef.current, {
        center: { lat: origin.coordinates[0], lng: origin.coordinates[1] },
        zoom: 6,
        disableDefaultUI: true,
        gestureHandling: 'greedy',
        mapTypeId: 'roadmap',
        tilt: 0,
        styles: CLEAN_MINIMAL_GOOGLE_MAPS_STYLE,
      });

      // Viewport Idle Handler with adaptive debounce for 60fps panning
      map.addListener('idle', () => {
        if (idleDebounceTimerRef.current) {
          clearTimeout(idleDebounceTimerRef.current);
        }
        const isMobileScreen = window.innerWidth < 768;
        idleDebounceTimerRef.current = setTimeout(() => {
          const bounds = getMapBounds();
          if (!bounds) return;
          setCurrentBounds(bounds);
          setCurrentZoom(map.getZoom() ?? 6);

          if (searchAsIMove) {
            if (onBoundsChange) onBoundsChange(bounds);
            setHasMovedSinceSearch(false);
          } else {
            setHasMovedSinceSearch(true);
          }
        }, isMobileScreen ? 220 : 120);
      });

      // Watch for Google Maps internal error overlay ("Oops! Something went wrong")
      const observer = new MutationObserver(() => {
        if (
          mapContainerRef.current?.querySelector('.gm-err-container') ||
          mapContainerRef.current?.innerHTML.includes('Oops! Something went wrong')
        ) {
          console.warn('Detected Google Maps internal error overlay. Auto-fallback to Leaflet.');
          setLoadError('Google Maps API key not activated. Using OpenStreetMap fallback.');
        }
      });
      observer.observe(mapContainerRef.current, { childList: true, subtree: true });

      mapInstanceRef.current = map;

      return () => {
        observer.disconnect();
        if (simulationAnimationRef.current) {
          cancelAnimationFrame(simulationAnimationRef.current);
        }
      };
    } catch (err: any) {
      console.error('Error instantiating Google Map:', err);
      setLoadError(err?.message || 'Error instantiating map');
    }
  }, [isGoogleLoaded]);

  // 3. Handle Map Theme Switcher
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (mapTheme === 'dark') {
      map.setMapTypeId('roadmap');
      map.setOptions({ styles: GOOGLE_DARK_STYLE });
    } else if (mapTheme === 'satellite') {
      map.setOptions({ styles: CLEAN_MINIMAL_GOOGLE_MAPS_STYLE });
      map.setMapTypeId('hybrid');
    } else if (mapTheme === 'terrain') {
      map.setOptions({ styles: CLEAN_MINIMAL_GOOGLE_MAPS_STYLE });
      map.setMapTypeId('terrain');
    } else {
      map.setOptions({ styles: CLEAN_MINIMAL_GOOGLE_MAPS_STYLE });
      map.setMapTypeId('roadmap');
    }
  }, [mapTheme]);

  // 4. Initial fit bounds
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || initialFitDoneRef.current || allSpots.length === 0 || activeRoute) return;

    if (props.targetView) {
      initialFitDoneRef.current = true;
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    bounds.extend({ lat: origin.coordinates[0], lng: origin.coordinates[1] });
    allSpots.slice(0, 50).forEach((s) => {
      bounds.extend({ lat: s.coordinates[0], lng: s.coordinates[1] });
    });

    map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
    initialFitDoneRef.current = true;
  }, [allSpots, origin, activeRoute, isGoogleLoaded, props.targetView]);

  // 4b. Smoothly fly and zoom to searched area
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !props.targetView) return;

    google.maps.event.trigger(map, 'resize');

    if (props.targetView.bounds) {
      const b = props.targetView.bounds;
      const gBounds = new google.maps.LatLngBounds(
        { lat: b.southWest.lat, lng: b.southWest.lng },
        { lat: b.northEast.lat, lng: b.northEast.lng }
      );
      map.fitBounds(gBounds, { top: 60, right: 60, bottom: 60, left: 60 });
    } else if (props.targetView.center) {
      map.setCenter({ lat: props.targetView.center[0], lng: props.targetView.center[1] });
      if (props.targetView.zoom) {
        map.setZoom(props.targetView.zoom);
      }
    }
  }, [props.targetView]);

  // 5. Origin (RV Start) Overlay Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isGoogleLoaded) return;

    if (originOverlayRef.current) {
      originOverlayRef.current.setMap(null);
      originOverlayRef.current = null;
    }

    class OriginOverlay extends google.maps.OverlayView {
      private div: HTMLDivElement | null = null;
      private latlng: google.maps.LatLng;

      constructor(latlng: google.maps.LatLng) {
        super();
        this.latlng = latlng;
      }

      onAdd() {
        const div = document.createElement('div');
        div.style.position = 'absolute';
        div.style.left = '0px';
        div.style.top = '0px';
        div.style.willChange = 'transform';
        div.style.cursor = 'pointer';
        div.style.zIndex = '2000';
        div.innerHTML = `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; min-width: 44px; min-height: 44px;">
            <div style="position: absolute; width: 36px; height: 36px; border-radius: 9999px; background: rgba(255, 90, 31, 0.35); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: relative; width: 32px; height: 32px; border-radius: 9999px; background: #111827; border: 2.5px solid #FFFFFF; box-shadow: 0 4px 14px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; font-size: 14px;">
              🚐
            </div>
          </div>
        `;

        this.div = div;
        const panes = this.getPanes();
        panes?.overlayMouseTarget.appendChild(div);
      }

      draw() {
        if (!this.div) return;
        const projection = this.getProjection();
        if (!projection) return;
        const point = projection.fromLatLngToDivPixel(this.latlng);
        if (point) {
          this.div.style.transform = `translate3d(${point.x}px, ${point.y}px, 0) translate(-50%, -50%)`;
        }
      }

      onRemove() {
        if (this.div && this.div.parentNode) {
          this.div.parentNode.removeChild(this.div);
          this.div = null;
        }
      }
    }

    const overlay = new OriginOverlay(new google.maps.LatLng(origin.coordinates[0], origin.coordinates[1]));
    overlay.setMap(map);
    originOverlayRef.current = overlay;
  }, [origin, isGoogleLoaded]);

  // 5b. Destination (Finish) Overlay Marker for Road Trips
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isGoogleLoaded) return;

    if (destinationOverlayRef.current) {
      destinationOverlayRef.current.setMap(null);
      destinationOverlayRef.current = null;
    }

    if (!tripRoute || !tripRoute.destination || !tripRoute.destination.coordinates) return;

    class DestinationOverlay extends google.maps.OverlayView {
      private div: HTMLDivElement | null = null;
      private latlng: google.maps.LatLng;

      constructor(latlng: google.maps.LatLng) {
        super();
        this.latlng = latlng;
      }

      onAdd() {
        const div = document.createElement('div');
        div.style.position = 'absolute';
        div.style.left = '0px';
        div.style.top = '0px';
        div.style.willChange = 'transform';
        div.style.cursor = 'pointer';
        div.style.zIndex = '2000';
        div.innerHTML = `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: auto;">
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
              <span style="max-width: 140px; overflow: hidden; text-overflow: ellipsis;">${tripRoute?.destination.title || 'Finish'}</span>
            </div>
            <div style="width: 14px; height: 14px; background: #FF5A1F; border-radius: 9999px; border: 2.5px solid #FFFFFF; box-shadow: 0 2px 6px rgba(0,0,0,0.35);"></div>
          </div>
        `;
        this.div = div;
        const panes = this.getPanes();
        panes?.overlayMouseTarget.appendChild(div);
      }

      draw() {
        if (!this.div) return;
        const projection = this.getProjection();
        if (!projection) return;
        const point = projection.fromLatLngToDivPixel(this.latlng);
        if (point) {
          this.div.style.transform = `translate3d(${point.x}px, ${point.y}px, 0) translate(-50%, -100%)`;
        }
      }

      onRemove() {
        if (this.div && this.div.parentNode) {
          this.div.parentNode.removeChild(this.div);
          this.div = null;
        }
      }
    }

    const destCoords = tripRoute.destination.coordinates;
    const overlay = new DestinationOverlay(new google.maps.LatLng(destCoords[0], destCoords[1]));
    overlay.setMap(map);
    destinationOverlayRef.current = overlay;
  }, [tripRoute, isGoogleLoaded]);

  // 5a. Manage Active Exploration Radius Radar Circle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isGoogleLoaded) return;

    if (radiusMiles && radiusMiles > 0) {
      const radiusMeters = radiusMiles * 1609.34;
      const center = { lat: origin.coordinates[0], lng: origin.coordinates[1] };

      if (!radiusCircleRef.current) {
        radiusCircleRef.current = new google.maps.Circle({
          strokeColor: '#FF5A1F',
          strokeOpacity: 0.5,
          strokeWeight: 2,
          fillColor: '#FF5A1F',
          fillOpacity: 0.05,
          map,
          center,
          radius: radiusMeters,
          clickable: false,
          zIndex: 50,
        });
      } else {
        radiusCircleRef.current.setCenter(center);
        radiusCircleRef.current.setRadius(radiusMeters);
        radiusCircleRef.current.setMap(map);
      }
    } else {
      if (radiusCircleRef.current) {
        radiusCircleRef.current.setMap(null);
      }
    }

    return () => {
      if (radiusCircleRef.current) {
        radiusCircleRef.current.setMap(null);
      }
    };
  }, [radiusMiles, origin, isGoogleLoaded]);

  // 6. Draw Uber-Style Driving Route Polylines
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isGoogleLoaded) return;

    if (routePolylineRef.current) {
      routePolylineRef.current.setMap(null);
      routePolylineRef.current = null;
    }
    if (routeGlowPolylineRef.current) {
      routeGlowPolylineRef.current.setMap(null);
      routeGlowPolylineRef.current = null;
    }
    if (midBadgeOverlayRef.current) {
      midBadgeOverlayRef.current.setMap(null);
      midBadgeOverlayRef.current = null;
    }
    if (simulatedVehicleOverlayRef.current) {
      simulatedVehicleOverlayRef.current.setMap(null);
      simulatedVehicleOverlayRef.current = null;
    }
    if (simulationAnimationRef.current) {
      cancelAnimationFrame(simulationAnimationRef.current);
      simulationAnimationRef.current = null;
    }

    if (!activeRoute || activeRoute.coordinates.length < 2) return;

    const path = activeRoute.coordinates.map((c) => ({ lat: c[0], lng: c[1] }));

    // Route Outer Glow
    const glowLine = new google.maps.Polyline({
      path,
      strokeColor: '#FF5A1F',
      strokeOpacity: 0.35,
      strokeWeight: 9,
      map,
      zIndex: 100,
    });

    // Route Core Solid Line
    const coreLine = new google.maps.Polyline({
      path,
      strokeColor: mapTheme === 'dark' ? '#FF7A45' : '#E03D00',
      strokeOpacity: 0.95,
      strokeWeight: 4.5,
      map,
      zIndex: 101,
    });

    routeGlowPolylineRef.current = glowLine;
    routePolylineRef.current = coreLine;

    // Mid-Route Duration / Distance Badge Overlay
    const midIndex = Math.floor(path.length / 2);
    const midPoint = path[midIndex];

    class BadgeOverlay extends google.maps.OverlayView {
      private div: HTMLDivElement | null = null;
      private latlng: google.maps.LatLng;

      constructor(latlng: google.maps.LatLng) {
        super();
        this.latlng = latlng;
      }

      onAdd() {
        const div = document.createElement('div');
        div.style.position = 'absolute';
        div.style.left = '0px';
        div.style.top = '0px';
        div.style.willChange = 'transform';
        div.style.zIndex = '1500';
        div.style.pointerEvents = 'none';
        div.innerHTML = `
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
          ">
            <span style="color: #FF5A1F;">🚗</span>
            <span>${activeRoute?.formattedDuration || ''}</span>
            <span style="color: #9CA3AF; font-size: 10px;">(${activeRoute?.distanceMiles || 0} mi)</span>
          </div>
        `;
        this.div = div;
        const panes = this.getPanes();
        panes?.overlayMouseTarget.appendChild(div);
      }

      draw() {
        if (!this.div) return;
        const projection = this.getProjection();
        if (!projection) return;
        const point = projection.fromLatLngToDivPixel(this.latlng);
        if (point) {
          this.div.style.transform = `translate3d(${point.x}px, ${point.y}px, 0) translate(-50%, -50%)`;
        }
      }

      onRemove() {
        if (this.div && this.div.parentNode) {
          this.div.parentNode.removeChild(this.div);
          this.div = null;
        }
      }
    }

    const badge = new BadgeOverlay(new google.maps.LatLng(midPoint.lat, midPoint.lng));
    badge.setMap(map);
    midBadgeOverlayRef.current = badge;

    // Smooth pan and fit to route, adding bottom padding on mobile so route doesn't overlap the card
    const bounds = new google.maps.LatLngBounds();
    path.forEach((p) => bounds.extend(p));
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    map.fitBounds(bounds, {
      top: isMobile ? 70 : 80,
      right: isMobile ? 30 : 80,
      bottom: isMobile ? 220 : 120,
      left: isMobile ? 30 : 80,
    });
  }, [activeRoute, mapTheme, isGoogleLoaded]);

  // 6b. Draw Scenic Detour Spur Roads from Highway to Camping Havens (different color than main road)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isGoogleLoaded) return;

    // Clean up previous spur elements
    spurLinesRef.current.forEach((l) => l.setMap(null));
    spurLinesRef.current = [];
    spurDotsRef.current.forEach((d) => d.setMap(null));
    spurDotsRef.current = [];
    if (selectedSpurGlowRef.current) {
      selectedSpurGlowRef.current.setMap(null);
      selectedSpurGlowRef.current = null;
    }
    if (selectedSpurCoreRef.current) {
      selectedSpurCoreRef.current.setMap(null);
      selectedSpurCoreRef.current = null;
    }
    if (selectedSpurBadgeRef.current) {
      selectedSpurBadgeRef.current.setMap(null);
      selectedSpurBadgeRef.current = null;
    }

    const routeCoords = activeRoute?.coordinates || tripRoute?.routeCoordinates;
    if (!routeCoords || routeCoords.length < 2) return;

    const spotsList = visibleSpots && visibleSpots.length > 0 ? visibleSpots : allSpots;
    const roadTripSpots = spotsList.filter((s) => (s as any).routeStopIndex !== undefined);

    if (roadTripSpots.length === 0) return;

    const lineDashSymbol = {
      path: 'M 0,-1 0,1',
      strokeOpacity: 0.95,
      scale: 2.5,
      strokeColor: '#059669', // Emerald Green - distinct from #FF5A1F orange highway
    };

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

      const path = [
        { lat: turnoff[0], lng: turnoff[1] },
        { lat: spot.coordinates[0], lng: spot.coordinates[1] },
      ];

      // Dashed connector spur road
      const polyline = new google.maps.Polyline({
        path,
        strokeOpacity: 0,
        icons: [
          {
            icon: lineDashSymbol,
            offset: '0',
            repeat: '9px',
          },
        ],
        map,
        zIndex: 90,
      });
      spurLinesRef.current.push(polyline);

      // Turnoff waypoint junction circle at highway
      const dot = new google.maps.Circle({
        center: { lat: turnoff[0], lng: turnoff[1] },
        radius: 35,
        fillColor: '#059669',
        fillOpacity: 0.9,
        strokeColor: '#FFFFFF',
        strokeWeight: 1.5,
        map,
        zIndex: 91,
      });
      spurDotsRef.current.push(dot);
    });

    // 2. Draw elevated, prominent spur road for the Selected Spot
    if (targetSelectedSpot) {
      const turnoff =
        (targetSelectedSpot as any).routeIntersectionCoords ||
        getClosestPointOnRoute(targetSelectedSpot.coordinates, routeCoords);

      const path = [
        { lat: turnoff[0], lng: turnoff[1] },
        { lat: targetSelectedSpot.coordinates[0], lng: targetSelectedSpot.coordinates[1] },
      ];

      // Outer glow line
      const selectedGlow = new google.maps.Polyline({
        path,
        strokeColor: '#10B981',
        strokeOpacity: 0.5,
        strokeWeight: 8,
        map,
        zIndex: 120,
      });
      selectedSpurGlowRef.current = selectedGlow;

      // Solid emerald core line
      const selectedCore = new google.maps.Polyline({
        path,
        strokeColor: '#047857',
        strokeOpacity: 1,
        strokeWeight: 4,
        map,
        zIndex: 121,
      });
      selectedSpurCoreRef.current = selectedCore;

      // Highway turnoff junction dot (pulsing white/emerald)
      const turnoffDot = new google.maps.Circle({
        center: { lat: turnoff[0], lng: turnoff[1] },
        radius: 65,
        fillColor: '#10B981',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 2.5,
        map,
        zIndex: 122,
      });
      spurDotsRef.current.push(turnoffDot);

      // Detour distance badge at the midpoint of the spur road
      const midLat = (turnoff[0] + targetSelectedSpot.coordinates[0]) / 2;
      const midLng = (turnoff[1] + targetSelectedSpot.coordinates[1]) / 2;
      const detourDist =
        (targetSelectedSpot as any).distanceToRoute ??
        (targetSelectedSpot as any).distanceMiles ??
        calculateHaversineDistanceMiles(turnoff, targetSelectedSpot.coordinates);

      const formattedDist = detourDist < 1 ? '< 1' : detourDist.toFixed(1);

      class DetourBadgeOverlay extends google.maps.OverlayView {
        private div: HTMLDivElement | null = null;
        private latlng: google.maps.LatLng;

        constructor(latlng: google.maps.LatLng) {
          super();
          this.latlng = latlng;
        }

        onAdd() {
          const div = document.createElement('div');
          div.style.position = 'absolute';
          div.style.left = '0px';
          div.style.top = '0px';
          div.style.willChange = 'transform';
          div.style.zIndex = '125';
          div.style.pointerEvents = 'none';
          div.innerHTML = `
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
            ">
              <span>🛣️ ${formattedDist} mi detour</span>
            </div>
          `;
          this.div = div;
          this.getPanes()?.overlayMouseTarget.appendChild(div);
        }

        draw() {
          if (!this.div) return;
          const projection = this.getProjection();
          if (!projection) return;
          const pt = projection.fromLatLngToDivPixel(this.latlng);
          if (pt) {
            this.div.style.transform = `translate3d(${pt.x}px, ${pt.y}px, 0)`;
          }
        }

        onRemove() {
          if (this.div && this.div.parentNode) {
            this.div.parentNode.removeChild(this.div);
            this.div = null;
          }
        }
      }

      const badge = new DetourBadgeOverlay(new google.maps.LatLng(midLat, midLng));
      badge.setMap(map);
      selectedSpurBadgeRef.current = badge;
    }
  }, [
    isGoogleLoaded,
    activeRoute,
    tripRoute,
    visibleSpots,
    allSpots,
    selectedSpotId,
    hoveredSpotId,
  ]);

  // 7. Vehicle Simulation Along Google Route
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !activeRoute || !isSimulatingDrive || activeRoute.coordinates.length < 2 || !isGoogleLoaded) {
      if (simulatedVehicleOverlayRef.current) {
        simulatedVehicleOverlayRef.current.setMap(null);
        simulatedVehicleOverlayRef.current = null;
      }
      if (simulationAnimationRef.current) {
        cancelAnimationFrame(simulationAnimationRef.current);
        simulationAnimationRef.current = null;
      }
      return;
    }

    const coords = activeRoute.coordinates;

    class SimVehicleOverlay extends google.maps.OverlayView {
      public div: HTMLDivElement | null = null;
      public latlng: google.maps.LatLng;

      constructor(latlng: google.maps.LatLng) {
        super();
        this.latlng = latlng;
      }

      onAdd() {
        const div = document.createElement('div');
        div.style.position = 'absolute';
        div.style.left = '0px';
        div.style.top = '0px';
        div.style.willChange = 'transform';
        div.style.zIndex = '3000';
        div.innerHTML = `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 34px; height: 34px; border-radius: 9999px; background: #FF5A1F; opacity: 0.35; animation: ping 1s infinite;"></div>
            <div style="width: 32px; height: 32px; border-radius: 9999px; background: #FF5A1F; border: 2px solid #FFFFFF; box-shadow: 0 4px 14px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; font-size: 16px;">
              🚐
            </div>
          </div>
        `;
        this.div = div;
        const panes = this.getPanes();
        panes?.overlayMouseTarget.appendChild(div);
      }

      draw() {
        if (!this.div) return;
        const projection = this.getProjection();
        if (!projection) return;
        const point = projection.fromLatLngToDivPixel(this.latlng);
        if (point) {
          this.div.style.transform = `translate3d(${point.x}px, ${point.y}px, 0) translate(-50%, -50%)`;
        }
      }

      updatePosition(newPos: google.maps.LatLng) {
        this.latlng = newPos;
        this.draw();
      }

      onRemove() {
        if (this.div && this.div.parentNode) {
          this.div.parentNode.removeChild(this.div);
          this.div = null;
        }
      }
    }

    const vehicle = new SimVehicleOverlay(new google.maps.LatLng(coords[0][0], coords[0][1]));
    vehicle.setMap(map);
    simulatedVehicleOverlayRef.current = vehicle;

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
        vehicle.updatePosition(new google.maps.LatLng(point[0], point[1]));
      }
      simulationAnimationRef.current = requestAnimationFrame(animateVehicle);
    };

    simulationAnimationRef.current = requestAnimationFrame(animateVehicle);

    return () => {
      if (simulationAnimationRef.current) {
        cancelAnimationFrame(simulationAnimationRef.current);
        simulationAnimationRef.current = null;
      }
      if (simulatedVehicleOverlayRef.current) {
        simulatedVehicleOverlayRef.current.setMap(null);
        simulatedVehicleOverlayRef.current = null;
      }
    };
  }, [isSimulatingDrive, activeRoute, onSimulationEnd, isGoogleLoaded]);

  // 8. Filter spots by chip in memory
  const chipFilteredSpots = useMemo(() => {
    let list = visibleSpots;
    if (activeChip === 'usfs') {
      list = list.filter(
        (s) =>
          (s as any).landManager === 'USFS' ||
          s.environment === 'forest' ||
          s.title.toLowerCase().includes('forest')
      );
    } else if (activeChip === 'blm') {
      list = list.filter(
        (s) =>
          (s as any).landManager === 'BLM' ||
          s.environment === 'desert' ||
          s.title.toLowerCase().includes('blm')
      );
    } else if (activeChip === 'bigrig') {
      list = list.filter((s) => s.rigCompatibility.maxLengthFt >= 35);
    } else if (activeChip === 'top') {
      list = list.filter((s) => (s.rating || 0) >= 4.8);
    }
    return list;
  }, [visibleSpots, activeChip]);

  // 9. Sample spots using smart grid (or isolate selected spot alone on map)
  const smartSampledSpots = useMemo(() => {
    if (selectedSpotId && isIsolated) {
      const selected = allSpots.find((s) => s.id === selectedSpotId);
      return selected ? [selected] : [];
    }
    const MAX_MARKERS = 30;
    const sampled = sampleSpotsEvenly(chipFilteredSpots, MAX_MARKERS, currentBounds);

    // Ensure selected spot is always present
    if (selectedSpotId && !sampled.some((s) => s.id === selectedSpotId)) {
      const selected = chipFilteredSpots.find((s) => s.id === selectedSpotId);
      if (selected) sampled.push(selected);
    }
    // Ensure hovered spot is always present
    if (hoveredSpotId && !sampled.some((s) => s.id === hoveredSpotId)) {
      const hovered = chipFilteredSpots.find((s) => s.id === hoveredSpotId);
      if (hovered) sampled.push(hovered);
    }

    return sampled;
  }, [chipFilteredSpots, currentBounds, selectedSpotId, hoveredSpotId, isIsolated, allSpots]);

  // Regional Hubs Calculation for Macro-Scale (zoomed out nationwide)
  const regionalHubs = useMemo(() => computeRegionalHubs(allSpots), [allSpots]);
  const isMacroZoom = !selectedSpotId && currentZoom < 7 && (!radiusMiles || radiusMiles > 250);

  // 10a. Render Regional Hub Overlay Clusters at Macro Zoom (zoom < 7)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isGoogleLoaded) return;

    if (!isMacroZoom) {
      hubOverlaysRef.current.forEach((ov) => {
        ov.setMap(null);
      });
      hubOverlaysRef.current.clear();
      return;
    }

    class RegionalHubOverlay extends google.maps.OverlayView {
      public div: HTMLDivElement | null = null;
      public hub: RegionalHubCluster;
      public latlng: google.maps.LatLng;

      constructor(hub: RegionalHubCluster) {
        super();
        this.hub = hub;
        this.latlng = new google.maps.LatLng(hub.coordinates[0], hub.coordinates[1]);
      }

      onAdd() {
        const div = document.createElement('div');
        div.style.position = 'absolute';
        div.style.left = '0px';
        div.style.top = '0px';
        div.style.willChange = 'transform';
        div.style.touchAction = 'manipulation';
        div.style.zIndex = '500';
        div.style.cursor = 'pointer';

        div.innerHTML = `
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
            transition: transform 0.15s ease;
          ">
            <span style="font-size: 12.5px;">${this.hub.icon}</span>
            <span style="
              color: #FF5A1F;
              font-weight: 900;
              font-size: 10.5px;
              letter-spacing: -0.2px;
            ">${this.hub.count.toLocaleString()}</span>
          </div>
        `;

        const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (!isTouch) {
          div.addEventListener('mouseenter', () => {
            const inner = div.firstElementChild as HTMLElement;
            if (inner) {
              inner.style.transform = 'scale(1.06)';
              inner.style.boxShadow = '0 6px 20px rgba(0,0,0,0.18)';
            }
          });
          div.addEventListener('mouseleave', () => {
            const inner = div.firstElementChild as HTMLElement;
            if (inner) {
              inner.style.transform = 'scale(1)';
              inner.style.boxShadow = '0 3px 12px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.06)';
            }
          });
        }

        div.addEventListener('click', (e) => {
          e.stopPropagation();
          const targetMap = mapInstanceRef.current;
          if (targetMap) {
            targetMap.setCenter({ lat: this.hub.coordinates[0], lng: this.hub.coordinates[1] });
            targetMap.setZoom(8);
          }
        });

        this.div = div;
        const panes = this.getPanes();
        panes?.overlayMouseTarget.appendChild(div);
      }

      draw() {
        if (!this.div) return;
        const projection = this.getProjection();
        if (!projection) return;
        const point = projection.fromLatLngToDivPixel(this.latlng);
        if (point) {
          this.div.style.transform = `translate3d(${point.x}px, ${point.y}px, 0) translate(-50%, -50%)`;
        }
      }

      onRemove() {
        if (this.div && this.div.parentNode) {
          this.div.parentNode.removeChild(this.div);
          this.div = null;
        }
      }
    }

    const currentHubIds = new Set(regionalHubs.map((h) => h.id));
    hubOverlaysRef.current.forEach((ov, id) => {
      if (!currentHubIds.has(id)) {
        ov.setMap(null);
        hubOverlaysRef.current.delete(id);
      }
    });

    regionalHubs.forEach((hub) => {
      if (!hubOverlaysRef.current.has(hub.id)) {
        const overlay = new RegionalHubOverlay(hub);
        overlay.setMap(map);
        hubOverlaysRef.current.set(hub.id, overlay);
      }
    });
  }, [isMacroZoom, regionalHubs, isGoogleLoaded]);

  // 10b. Render Sleek Airbnb Capsule Pill Markers (zoom >= 7 or within radius)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isGoogleLoaded) return;

    // At macro national scale, hide individual spots to prevent nationwide clutter
    if (isMacroZoom) {
      overlaysRef.current.forEach((ov) => {
        ov.setMap(null);
      });
      overlaysRef.current.clear();
      return;
    }

    // 1. Remove markers no longer in smartSampledSpots
    const newSpotIds = new Set(smartSampledSpots.map((s) => s.id));
    overlaysRef.current.forEach((ov, id) => {
      if (!newSpotIds.has(id)) {
        ov.setMap(null);
        overlaysRef.current.delete(id);
      }
    });

    // 2. Class definition (instantiated only for new spots)
    class SpotMarkerOverlay extends google.maps.OverlayView {
      public div: HTMLDivElement | null = null;
      public spot: Spot;
      public latlng: google.maps.LatLng;
      public isSelected: boolean;
      public isHovered: boolean;

      constructor(spot: Spot, isSelected: boolean, isHovered: boolean) {
        super();
        this.spot = spot;
        this.latlng = new google.maps.LatLng(spot.coordinates[0], spot.coordinates[1]);
        this.isSelected = isSelected;
        this.isHovered = isHovered;
      }

      renderHTML() {
        const bg = this.isSelected ? '#FF5A1F' : this.isHovered ? '#0f172a' : '#FFFFFF';
        const color = this.isSelected || this.isHovered ? '#FFFFFF' : '#0f172a';
        const badgeBg = this.isSelected ? 'rgba(255,255,255,0.25)' : '#FF5A1F';
        const scale = this.isSelected || this.isHovered ? 'scale(1.12)' : 'scale(1)';
        const shadow = this.isSelected
          ? '0 6px 20px rgba(255, 90, 31, 0.4)'
          : this.isHovered
          ? '0 6px 18px rgba(0,0,0,0.25)'
          : '0 2px 8px rgba(0,0,0,0.08)';
        const border = this.isSelected ? '#FF5A1F' : this.isHovered ? '#0f172a' : 'rgba(0,0,0,0.08)';
        const googleUrl = getGoogleMapsNavigationUrl(origin.coordinates, this.spot.coordinates, this.spot.title);

        const stopIdx = (this.spot as any).routeStopIndex;
        const etaText = (this.spot as any).arrivalTimeFormatted ? ` · ETA ${(this.spot as any).arrivalTimeFormatted}` : '';
        const detourText = (this.spot as any).distanceToRoute !== undefined ? ` (${(this.spot as any).distanceToRoute} mi off road)` : '';

        const isRoadTripStop = Boolean(stopIdx);

        const titleBadge = (this.isSelected || (this.isHovered && isRoadTripStop)) ? `
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
            <span style="font-size: 11px; font-weight: 800; max-width: 150px; overflow: hidden; text-overflow: ellipsis;">${this.spot.title}${etaText}</span>
            <button class="spot-details-action" data-spot-id="${this.spot.id}" style="
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
          const pillBg = this.isSelected
            ? 'linear-gradient(135deg, #FF5A1F 0%, #EA580C 100%)'
            : this.isHovered
            ? '#0F172A'
            : '#FFFFFF';
          const pillText = this.isSelected || this.isHovered ? '#FFFFFF' : '#0F172A';
          const pillBorder = this.isSelected ? '#FFFFFF' : this.isHovered ? '#FF5A1F' : '#059669';
          const pillShadow = this.isSelected
            ? '0 0 0 3px rgba(255, 90, 31, 0.45), 0 8px 24px rgba(255, 90, 31, 0.5)'
            : this.isHovered
            ? '0 0 0 2px rgba(15, 23, 42, 0.35), 0 6px 18px rgba(0,0,0,0.25)'
            : '0 0 0 2px rgba(5, 150, 105, 0.25), 0 4px 14px rgba(0,0,0,0.18)';

          const detourBadge = (this.spot as any).distanceToRoute !== undefined
            ? `<span style="background: ${this.isSelected ? 'rgba(255,255,255,0.2)' : '#ECFDF5'}; color: ${this.isSelected ? '#FFFFFF' : '#047857'}; padding: 1px 5px; border-radius: 6px; font-weight: 800; font-size: 9px;">${(this.spot as any).distanceToRoute < 1 ? '<1' : (this.spot as any).distanceToRoute}mi</span>`
            : `<span style="font-size: 9.5px; opacity: 0.9;">${this.spot.rigCompatibility.maxLengthFt}ft</span>`;

          const showTitle = this.isSelected || this.isHovered;
          const titleMarkup = showTitle
            ? `<span style="font-size: 11px; font-weight: 800; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${this.spot.title}</span>`
            : '';

          markerPillContent = `
            <div style="
              display: inline-flex;
              align-items: center;
              gap: 4px;
              padding: ${this.isSelected ? '4.5px 10px' : '2.5px 6.5px'};
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
              <span style="background: ${this.isSelected ? 'rgba(255,255,255,0.25)' : 'linear-gradient(135deg, #FF5A1F, #D97706)'}; color: #FFFFFF; padding: 1.5px 5.5px; border-radius: 9999px; font-weight: 900; font-size: 10px; letter-spacing: 0.2px; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">#${stopIdx}</span>
              ${titleMarkup}
              ${detourBadge}
            </div>
          `;
        } else {
          markerPillContent = `
            <div style="
              display: inline-flex;
              align-items: center;
              gap: 5px;
              padding: ${this.isSelected ? '5px 10px' : '3px 8px'};
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
              <span style="font-size: 10.5px; opacity: 0.95; font-weight: 600;">${this.spot.rigCompatibility.maxLengthFt}ft</span>
            </div>
          `;
        }

        return `
          ${titleBadge}
          <div style="transform: ${scale}; transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1);">
            ${markerPillContent}
          </div>
        `;
      }

      updateState(isSelected: boolean, isHovered: boolean) {
        if (this.isSelected === isSelected && this.isHovered === isHovered) return;
        this.isSelected = isSelected;
        this.isHovered = isHovered;
        if (!this.div) return;
        const stopIdx = (this.spot as any).routeStopIndex;
        const baseZ = stopIdx ? 600 + Math.min(Number(stopIdx), 200) : 10;
        this.div.style.zIndex = this.isSelected || this.isHovered ? '999' : String(baseZ);
        this.div.innerHTML = this.renderHTML();
      }

      onAdd() {
        const div = document.createElement('div');
        div.style.position = 'absolute';
        div.style.left = '0px';
        div.style.top = '0px';
        div.style.willChange = 'transform';
        div.style.touchAction = 'manipulation';
        const stopIdx = (this.spot as any).routeStopIndex;
        const baseZ = stopIdx ? 600 + Math.min(Number(stopIdx), 200) : 10;
        div.style.zIndex = this.isSelected || this.isHovered ? '999' : String(baseZ);
        div.style.cursor = 'pointer';
        div.innerHTML = this.renderHTML();

        div.addEventListener('click', (e) => {
          e.stopPropagation();
          if (this.isSelected && onNavigateToDetails) {
            onNavigateToDetails(this.spot.id);
          } else {
            onSelectSpot(this.spot);
          }
        });

        this.div = div;
        const panes = this.getPanes();
        panes?.overlayMouseTarget.appendChild(div);
      }

      draw() {
        if (!this.div) return;
        const projection = this.getProjection();
        if (!projection) return;
        const point = projection.fromLatLngToDivPixel(this.latlng);
        if (point) {
          this.div.style.transform = `translate3d(${point.x}px, ${point.y}px, 0) translate(-50%, -50%)`;
        }
      }

      onRemove() {
        if (this.div && this.div.parentNode) {
          this.div.parentNode.removeChild(this.div);
          this.div = null;
        }
      }
    }

    // 3. Add or fast-update existing overlays
    smartSampledSpots.forEach((spot) => {
      const isHovered = hoveredSpotId === spot.id;
      const isSelected = selectedSpotId === spot.id;
      const existing = overlaysRef.current.get(spot.id) as any;

      if (existing) {
        if (existing.updateState) {
          existing.updateState(isSelected, isHovered);
        }
      } else {
        const overlay = new SpotMarkerOverlay(spot, isSelected, isHovered);
        overlay.setMap(map);
        overlaysRef.current.set(spot.id, overlay);
      }
    });
  }, [smartSampledSpots, hoveredSpotId, selectedSpotId, onSelectSpot, isMacroZoom, isGoogleLoaded, onNavigateToDetails]);

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
    if (!selectedSpotId || !mapInstanceRef.current || !isGoogleLoaded) return;
    const spot = allSpots.find((s) => s.id === selectedSpotId);
    if (!spot) return;
    if (!activeRoute) {
      mapInstanceRef.current.panTo({ lat: spot.coordinates[0], lng: spot.coordinates[1] });
      mapInstanceRef.current.setZoom(12);
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setTimeout(() => {
          mapInstanceRef.current?.panBy(0, 80);
        }, 150);
      }
    }
  }, [selectedSpotId, allSpots, activeRoute, isGoogleLoaded]);

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
        mapInstanceRef.current?.panTo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        mapInstanceRef.current?.setZoom(10);
      },
      () => {
        setIsLocatingUser(false);
        alert('Could not retrieve GPS location. Using preset hub.');
      },
      { timeout: 8000 }
    );
  };

  // Manual "Search this area"
  const handleManualSearchArea = () => {
    const bounds = getMapBounds();
    if (bounds && onBoundsChange) {
      onBoundsChange(bounds);
      setHasMovedSinceSearch(false);
    }
  };

  // Reset to All US
  const handleResetToAllUS = () => {
    const map = mapInstanceRef.current;
    if (!map || allSpots.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    bounds.extend({ lat: origin.coordinates[0], lng: origin.coordinates[1] });
    allSpots.slice(0, 50).forEach((s) => bounds.extend({ lat: s.coordinates[0], lng: s.coordinates[1] }));

    map.fitBounds(bounds, { top: 48, right: 48, bottom: 48, left: 48 });
    const b = getMapBounds();
    if (b && onBoundsChange) {
      onBoundsChange(b);
    }
    if (props.onClearSearch) {
      props.onClearSearch();
    }
    setHasMovedSinceSearch(false);
  };

  return (
    <div
      className={`relative rounded-3xl overflow-hidden shadow-airbnb border border-dark-200 bg-white ${className}`}
    >
      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[460px]" />

      {/* Top Center: Minimalist Map Quick Filter Strip (desktop only, hidden on mobile or when viewing single spot) */}
      {!isolateSelectedSpot && (
        <div className="hidden md:flex absolute top-3 inset-x-0 mx-auto w-full max-w-2xl px-3 justify-center z-[400] pointer-events-none">
        {/* Horizontal Quick Filter & Auto-Search Strip */}
        <div className="pointer-events-auto flex items-center flex-nowrap touch-pan-x gap-1.5 overflow-x-auto no-scrollbar py-0.5 px-1 max-w-full">
          {hasMovedSinceSearch && !searchAsIMove ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleManualSearchArea();
              }}
              className="bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black text-roo-600 border border-roo-200 flex items-center gap-1.5 shadow-sm hover:bg-white active:scale-95 transition-all shrink-0"
            >
              <RefreshCw className="w-3 h-3 text-roo-500 animate-spin" />
              <span>Search this area</span>
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
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
              props.onChangeAgencyFilter?.('all');
              setActiveChip('all');
            }}
            className={`px-3 py-1 rounded-full text-[11px] font-extrabold transition-all shadow-2xs border shrink-0 flex items-center gap-1 ${
              (props.activeAgencyFilter || activeChip) === 'all'
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
              props.onChangeAgencyFilter?.('USFS');
              setActiveChip('usfs');
            }}
            className={`px-3 py-1 rounded-full text-[11px] font-extrabold transition-all shadow-2xs border shrink-0 flex items-center gap-1 ${
              (props.activeAgencyFilter === 'USFS' || activeChip === 'usfs')
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
              props.onChangeAgencyFilter?.('BLM');
              setActiveChip('blm');
            }}
            className={`px-3 py-1 rounded-full text-[11px] font-extrabold transition-all shadow-2xs border shrink-0 flex items-center gap-1 ${
              (props.activeAgencyFilter === 'BLM' || activeChip === 'blm')
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
              onClick={(e) => {
                e.stopPropagation();
                setShowOriginMenu(!showOriginMenu);
              }}
              className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/95 backdrop-blur-md text-dark-800 hover:text-dark-950 border border-dark-200 shadow-2xs flex items-center gap-1.5"
            >
              <span>🚐</span>
              <span className="truncate max-w-[80px] sm:max-w-[120px]">{origin.name.replace('Live GPS Location', 'Live GPS')}</span>
              <ChevronDown className="w-3 h-3 text-dark-500" />
            </button>

            {showOriginMenu && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute top-full right-0 mt-2 w-64 bg-white/95 backdrop-blur-xl border border-dark-200 rounded-2xl shadow-xl p-2 z-50 divide-y divide-dark-100"
              >
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
                        mapInstanceRef.current?.panTo({ lat: orig.coordinates[0], lng: orig.coordinates[1] });
                        mapInstanceRef.current?.setZoom(8);
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
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand();
            }}
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
            onClick={(e) => {
              e.stopPropagation();
              setShowLayersMenu(!showLayersMenu);
            }}
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
                onClick={() => { setMapTheme('roadmap'); setShowLayersMenu(false); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold text-left flex items-center gap-2 transition-colors ${mapTheme === 'roadmap' ? 'bg-dark-900 text-white' : 'hover:bg-dark-100 text-dark-800'}`}
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span>Roadmap</span>
              </button>
              <button
                onClick={() => { setMapTheme('satellite'); setShowLayersMenu(false); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold text-left flex items-center gap-2 transition-colors ${mapTheme === 'satellite' ? 'bg-dark-900 text-white' : 'hover:bg-dark-100 text-dark-800'}`}
              >
                <Satellite className="w-3.5 h-3.5" />
                <span>Satellite</span>
              </button>
              <button
                onClick={() => { setMapTheme('terrain'); setShowLayersMenu(false); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold text-left flex items-center gap-2 transition-colors ${mapTheme === 'terrain' ? 'bg-dark-900 text-white' : 'hover:bg-dark-100 text-dark-800'}`}
              >
                <Mountain className="w-3.5 h-3.5" />
                <span>Terrain</span>
              </button>
              <button
                onClick={() => { setMapTheme('dark'); setShowLayersMenu(false); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold text-left flex items-center gap-2 transition-colors ${mapTheme === 'dark' ? 'bg-dark-900 text-white' : 'hover:bg-dark-100 text-dark-800'}`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Dark</span>
              </button>
            </div>
          )}
        </div>

        {/* GPS Near Me */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleUseCurrentLocation();
          }}
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
          onClick={(e) => {
            e.stopPropagation();
            handleResetToAllUS();
          }}
          title="Reset to whole US"
          className="hidden sm:flex p-2.5 rounded-2xl bg-white/95 backdrop-blur-md text-dark-800 hover:text-dark-950 hover:bg-white border border-dark-200/80 shadow-md transition-all items-center justify-center group"
        >
          <Compass className="w-4 h-4 text-roo-500 group-hover:rotate-45 transition-transform duration-300" />
        </button>

        {/* Zoom Controls (hidden on mobile, pinch-to-zoom is standard) */}
        <div className="hidden sm:flex bg-white/95 backdrop-blur-md rounded-2xl border border-dark-200/80 shadow-md overflow-hidden flex-col divide-y divide-dark-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              const currentZoom = mapInstanceRef.current?.getZoom() || 6;
              mapInstanceRef.current?.setZoom(currentZoom + 1);
            }}
            title="Zoom In"
            className="p-2 text-dark-800 hover:text-dark-950 hover:bg-dark-50 transition-colors flex items-center justify-center"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              const currentZoom = mapInstanceRef.current?.getZoom() || 6;
              mapInstanceRef.current?.setZoom(currentZoom - 1);
            }}
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
