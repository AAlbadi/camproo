import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { Spot } from '../../types';
import { RefreshCw, Compass, ZoomIn, ZoomOut, Check } from 'lucide-react';

export interface MapBounds {
  northEast: { lat: number; lng: number };
  southWest: { lat: number; lng: number };
}

interface InteractiveMapProps {
  allSpots: Spot[];
  visibleSpots: Spot[];
  hoveredSpotId: string | null;
  selectedSpotId: string | null;
  onSelectSpot: (id: string) => void;
  onBoundsChange?: (bounds: MapBounds) => void;
  className?: string;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  allSpots,
  visibleSpots,
  hoveredSpotId,
  selectedSpotId,
  onSelectSpot,
  onBoundsChange,
  className = '',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const initialFitDoneRef = useRef(false);

  // Airbnb Search-As-I-Move State
  const [searchAsIMove, setSearchAsIMove] = useState(true);
  const [hasMovedSinceSearch, setHasMovedSinceSearch] = useState(false);

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

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // US geographic center default
    const map = L.map(mapContainerRef.current, {
      center: [39.8283, -98.5795],
      zoom: 4,
      zoomControl: false, // We supply custom liquid-glass zoom controls
      scrollWheelZoom: true,
    });

    // CartoDB Voyager Minimalist Light Tile Layer (Airbnb-style crisp cartography)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; CARTO &copy; OpenStreetMap',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    // Move & Zoom Event Handlers (Airbnb Logic)
    const handleMoveEnd = () => {
      const bounds = getMapBounds();
      if (!bounds) return;

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
      initialFitDoneRef.current = false;
    };
  }, [searchAsIMove, onBoundsChange, getMapBounds]);

  // Initial bounds fit to all spots
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || initialFitDoneRef.current || allSpots.length === 0) return;

    const bounds = L.latLngBounds([]);
    allSpots.forEach(s => bounds.extend(s.coordinates));

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 6 });
      initialFitDoneRef.current = true;
    }
  }, [allSpots]);

  // Update Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current.clear();

    visibleSpots.forEach(spot => {
      const isHovered = hoveredSpotId === spot.id;
      const isSelected = selectedSpotId === spot.id;

      // Signature Airbnb Price Pill Marker
      const customIcon = L.divIcon({
        className: 'custom-camproo-marker',
        html: `
          <div style="cursor: pointer; transform: ${isHovered || isSelected ? 'scale(1.18)' : 'scale(1)'}; z-index: ${isHovered || isSelected ? 999 : 1}; transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);">
            <div style="
              display: inline-flex;
              align-items: center;
              gap: 5px;
              padding: 6px 11px;
              border-radius: 9999px;
              background-color: ${isHovered || isSelected ? '#111111' : '#FFFFFF'};
              color: ${isHovered || isSelected ? '#FFFFFF' : '#111111'};
              font-family: -apple-system, BlinkMacSystemFont, sans-serif;
              font-size: 12px;
              font-weight: 800;
              box-shadow: ${isHovered || isSelected ? '0 8px 24px rgba(0,0,0,0.35)' : '0 2px 8px rgba(0,0,0,0.12)'};
              border: 1px solid ${isHovered || isSelected ? '#000000' : 'rgba(0,0,0,0.08)'};
              white-space: nowrap;
            ">
              <span style="color: #FF5A1F; font-weight: 900; font-size: 11px;">FREE</span>
              <span style="font-size: 11px; color: ${isHovered || isSelected ? '#E2E8F0' : '#555555'}; font-weight: 700;">${spot.rigCompatibility.maxLengthFt}ft</span>
            </div>
          </div>
        `,
        iconSize: [88, 34],
        iconAnchor: [44, 17],
      });

      const marker = L.marker(spot.coordinates, { icon: customIcon }).addTo(map);

      // Airbnb-style floating mini preview popup
      const popupHtml = `
        <div style="width: 230px; font-family: -apple-system, BlinkMacSystemFont, sans-serif; cursor: pointer; border-radius: 16px; overflow: hidden;">
          <div style="position: relative; width: 100%; height: 135px; overflow: hidden;">
            <img src="${spot.photos[0]}" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
            <div style="position: absolute; top: 8px; left: 8px; background: rgba(0,0,0,0.65); backdrop-filter: blur(8px); color: #fff; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 800; text-transform: uppercase;">
              100% FREE
            </div>
          </div>
          <div style="padding: 10px 12px; background: #fff;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
              <span style="font-size: 11px; font-weight: 700; color: #717171;">${spot.locationName}, ${spot.generalArea}</span>
              <span style="font-size: 11px; font-weight: 800; color: #111;">★ ${spot.rating}</span>
            </div>
            <div style="font-size: 13px; font-weight: 800; color: #111; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${spot.title}
            </div>
            <div style="font-size: 11px; font-weight: 600; color: #15803D; margin-top: 4px;">
              🚐 Fits up to ${spot.rigCompatibility.maxLengthFt} ft · ${spot.amenities.electricity.toUpperCase()}
            </div>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        closeButton: false,
        offset: [0, -18],
        autoPan: false,
      });

      marker.on('click', () => {
        onSelectSpot(spot.id);
      });

      markersRef.current.set(spot.id, marker);
    });
  }, [visibleSpots, hoveredSpotId, selectedSpotId, onSelectSpot]);

  // Pan to hovered spot if applicable
  useEffect(() => {
    if (!hoveredSpotId || !mapInstanceRef.current) return;
    const spot = visibleSpots.find(s => s.id === hoveredSpotId);
    if (spot) {
      // Bring marker to front
      const marker = markersRef.current.get(spot.id);
      if (marker) {
        marker.setZIndexOffset(1000);
      }
    }
  }, [hoveredSpotId, visibleSpots]);

  const handleManualSearchArea = () => {
    const bounds = getMapBounds();
    if (bounds && onBoundsChange) {
      onBoundsChange(bounds);
      setHasMovedSinceSearch(false);
    }
  };

  const handleResetToAllUS = () => {
    const map = mapInstanceRef.current;
    if (!map || allSpots.length === 0) return;

    const bounds = L.latLngBounds([]);
    allSpots.forEach(s => bounds.extend(s.coordinates));
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 6 });
      const currentBounds = getMapBounds();
      if (currentBounds && onBoundsChange) {
        onBoundsChange(currentBounds);
      }
      setHasMovedSinceSearch(false);
    }
  };

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  return (
    <div className={`relative rounded-3xl overflow-hidden shadow-airbnb border border-dark-200 bg-white ${className}`}>
      {/* The Leaflet Canvas */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[460px]" />

      {/* Top Center: Airbnb Signature "Search as I move the map" Pill */}
      <div className="absolute top-4 inset-x-0 flex justify-center z-[400] pointer-events-none px-4">
        {hasMovedSinceSearch && !searchAsIMove ? (
          <button
            onClick={handleManualSearchArea}
            className="pointer-events-auto liquid-glass px-4 py-2 rounded-full text-xs font-bold text-dark-900 flex items-center gap-2 hover:bg-white transition-all shadow-md active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5 text-roo-500 animate-spin" />
            <span>Search this area</span>
          </button>
        ) : (
          <label className="pointer-events-auto liquid-glass px-4 py-2 rounded-full text-xs font-bold text-dark-900 flex items-center gap-2.5 shadow-md cursor-pointer hover:bg-white transition-all">
            <div
              onClick={() => {
                const next = !searchAsIMove;
                setSearchAsIMove(next);
                if (next) {
                  const bounds = getMapBounds();
                  if (bounds && onBoundsChange) onBoundsChange(bounds);
                }
              }}
              className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                searchAsIMove ? 'bg-dark-900 border-dark-900 text-white' : 'border-dark-400 bg-white'
              }`}
            >
              {searchAsIMove && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
            <span>Search as I move the map</span>
          </label>
        )}
      </div>

      {/* Top Right: Spot Count Pill */}
      <div className="absolute top-4 right-4 z-[400] liquid-glass px-3.5 py-1.5 rounded-full text-xs font-bold text-dark-900 flex items-center gap-2 shadow-sm">
        <span className="w-2 h-2 rounded-full bg-roo-500 animate-pulse" />
        <span>{visibleSpots.length} Spots in view</span>
      </div>

      {/* Bottom Right: Liquid Glass Navigation Controls (Zoom & Reset) */}
      <div className="absolute bottom-6 right-4 z-[400] flex flex-col gap-2">
        <button
          onClick={handleResetToAllUS}
          title="Reset to all US spots"
          className="liquid-glass p-2.5 rounded-2xl text-dark-800 hover:text-dark-950 hover:bg-white shadow-md transition-all flex items-center justify-center group"
        >
          <Compass className="w-4 h-4 text-roo-500 group-hover:rotate-45 transition-transform duration-300" />
        </button>
        <div className="liquid-glass rounded-2xl shadow-md overflow-hidden flex flex-col divide-y divide-dark-200/50">
          <button
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-2.5 text-dark-800 hover:text-dark-950 hover:bg-white transition-colors flex items-center justify-center"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-2.5 text-dark-800 hover:text-dark-950 hover:bg-white transition-colors flex items-center justify-center"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
