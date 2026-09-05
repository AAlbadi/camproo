import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Spot, SearchFilterState } from '../../types';
import {
  US_STATES,
  POPULAR_CAMPING_AREAS,
  findCampingArea,
  geocodeArea,
  getAreaSearchSuggestions,
  fetchLiveCitySuggestions,
  countSpotsByState,
  SearchSuggestion,
} from '../../lib/areaSearchService';
import { calculateRoute, POPULAR_ROAD_TRIP_PRESETS, PopularRoadTripPreset } from '../../lib/routeService';
import {
  Search,
  MapPin,
  X,
  Navigation,
  Loader2,
  Compass,
  Tent,
  Trees,
  Mountain,
  Building2,
  Milestone,
  ArrowRight,
  ArrowUpDown,
  Clock,
  Sparkles,
} from 'lucide-react';

export interface AreaSelectPayload {
  title: string;
  center: [number, number];
  zoom?: number;
  bbox?: [number, number, number, number];
  stateAbbr?: string;
  spotId?: string;
  radiusMiles?: number;
}

export type TripRoutePayload = NonNullable<SearchFilterState['tripRoute']>;

interface MapSearchBarProps {
  spots: Spot[];
  value: string;
  onChange: (value: string) => void;
  onSelectArea: (payload: AreaSelectPayload) => void;
  onClear: () => void;
  onNearMe?: () => void;
  isLocating?: boolean;
  className?: string;
  placeholder?: string;
  userLocation?: { lat: number; lng: number } | null;
  activeTripRoute?: SearchFilterState['tripRoute'];
  onSelectTripRoute?: (trip: TripRoutePayload) => void;
  onClearTripRoute?: () => void;
}

export const MapSearchBar: React.FC<MapSearchBarProps> = ({
  spots,
  value,
  onChange,
  onSelectArea,
  onClear,
  onNearMe,
  isLocating = false,
  className = '',
  placeholder = 'Search area, city, state, or park (e.g. Sedona, California, Tahoe, Moab)...',
  userLocation,
  activeTripRoute,
  onSelectTripRoute,
  onClearTripRoute,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [liveSuggestions, setLiveSuggestions] = useState<SearchSuggestion[]>([]);
  const [isFetchingLive, setIsFetchingLive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // --- Road Trip Planner State ---
  const [isTripPlannerOpen, setIsTripPlannerOpen] = useState(false);
  const [startQuery, setStartQuery] = useState(userLocation ? 'My Live GPS Location' : '');
  const [startCoords, setStartCoords] = useState<[number, number] | null>(
    userLocation ? [userLocation.lat, userLocation.lng] : null
  );
  const [startSuggestions, setStartSuggestions] = useState<SearchSuggestion[]>([]);
  const [isStartDropdownOpen, setIsStartDropdownOpen] = useState(false);

  const [endQuery, setEndQuery] = useState('');
  const [endCoords, setEndCoords] = useState<[number, number] | null>(null);
  const [endSuggestions, setEndSuggestions] = useState<SearchSuggestion[]>([]);
  const [isEndDropdownOpen, setIsEndDropdownOpen] = useState(false);

  const [corridorMiles, setCorridorMiles] = useState<number>(25);
  const [isCalculatingTrip, setIsCalculatingTrip] = useState(false);
  const [tripError, setTripError] = useState<string | null>(null);

  const tripPlannerRef = useRef<HTMLDivElement>(null);

  // Sync start location when GPS becomes available
  useEffect(() => {
    if (userLocation && (!startCoords || startQuery === '' || startQuery === 'My Live GPS Location')) {
      setStartCoords([userLocation.lat, userLocation.lng]);
      if (!startQuery) setStartQuery('My Live GPS Location');
    }
  }, [userLocation]);

  // Debounced autocomplete for Road Trip Start input
  useEffect(() => {
    const q = startQuery.trim();
    if (q.length < 2 || q.toLowerCase() === 'my live gps location') {
      setStartSuggestions([]);
      return;
    }
    let active = true;
    const timer = setTimeout(async () => {
      try {
        const live = await fetchLiveCitySuggestions(q);
        if (active) setStartSuggestions(live);
      } catch (e) {
        if (active) setStartSuggestions([]);
      }
    }, 180);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [startQuery]);

  // Debounced autocomplete for Road Trip End input
  useEffect(() => {
    const q = endQuery.trim();
    if (q.length < 2) {
      setEndSuggestions([]);
      return;
    }
    let active = true;
    const timer = setTimeout(async () => {
      try {
        const live = await fetchLiveCitySuggestions(q);
        if (active) setEndSuggestions(live);
      } catch (e) {
        if (active) setEndSuggestions([]);
      }
    }, 180);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [endQuery]);

  // Precompute state counts
  const stateCounts = useMemo(() => countSpotsByState(spots), [spots]);

  // Compute local suggestions based on current query
  const localSuggestions = useMemo(() => {
    return getAreaSearchSuggestions(value, spots, stateCounts);
  }, [value, spots, stateCounts]);

  // Live real-time suggestions (debounced 180ms) for any city across the US
  useEffect(() => {
    const q = value.trim();
    if (q.length < 2) {
      setLiveSuggestions([]);
      setIsFetchingLive(false);
      return;
    }

    let isMounted = true;
    setIsFetchingLive(true);
    const timer = setTimeout(async () => {
      try {
        const live = await fetchLiveCitySuggestions(q);
        if (isMounted) {
          setLiveSuggestions(live);
        }
      } catch (err) {
        if (isMounted) setLiveSuggestions([]);
      } finally {
        if (isMounted) setIsFetchingLive(false);
      }
    }, 180);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [value]);

  // Merge local & live suggestions, deduplicating by title
  const suggestions = useMemo(() => {
    if (!value.trim()) {
      return localSuggestions;
    }

    const merged: SearchSuggestion[] = [];
    const seenTitles = new Set<string>();

    // 1. Add local suggestions (destinations, states, spots)
    for (const item of localSuggestions) {
      const key = item.title.toLowerCase().trim();
      if (!seenTitles.has(key)) {
        seenTitles.add(key);
        merged.push(item);
      }
    }

    // 2. Append live geocoded city suggestions
    for (const item of liveSuggestions) {
      const key = item.title.toLowerCase().trim();
      if (!seenTitles.has(key)) {
        seenTitles.add(key);
        merged.push(item);
      }
    }

    return merged.slice(0, 10);
  }, [localSuggestions, liveSuggestions, value]);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleSelectSuggestion = (sug: SearchSuggestion) => {
    onChange(sug.title);
    setIsOpen(false);
    onSelectArea({
      title: sug.title,
      center: sug.center,
      zoom: sug.zoom,
      bbox: sug.bbox,
      stateAbbr: sug.stateAbbr,
      spotId: sug.spot?.id,
      radiusMiles: sug.radiusMiles,
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;

    // 1. Check if highlighted suggestion exists
    if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
      handleSelectSuggestion(suggestions[highlightedIndex]);
      return;
    }

    const q = value.trim();

    // 2. Check if user typed a state name or abbreviation
    for (const [abbr, state] of Object.entries(US_STATES)) {
      if (q.toLowerCase() === state.name.toLowerCase() || q.toUpperCase() === abbr) {
        onSelectArea({
          title: state.name,
          center: state.center,
          zoom: 7,
          bbox: state.bbox,
          stateAbbr: abbr,
        });
        setIsOpen(false);
        return;
      }
    }

    // 3. Check recognized popular camping areas
    const matchedArea = findCampingArea(q);
    if (matchedArea) {
      onSelectArea({
        title: matchedArea.name,
        center: matchedArea.center,
        zoom: matchedArea.zoom,
        stateAbbr: matchedArea.stateAbbr,
        radiusMiles: matchedArea.radiusMiles,
      });
      setIsOpen(false);
      return;
    }

    // 4. Auto-select top suggestion if available
    if (suggestions.length > 0) {
      handleSelectSuggestion(suggestions[0]);
      return;
    }

    // 5. Fallback to live geocoding (Photon + OSM fallback)
    setIsGeocoding(true);
    try {
      const geo = await geocodeArea(q);
      if (geo) {
        onSelectArea({
          title: geo.displayName || q,
          center: geo.center,
          zoom: 10,
          bbox: geo.bbox,
          radiusMiles: 50,
        });
      }
    } finally {
      setIsGeocoding(false);
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // --- Road Trip Handlers ---
  const handleSwapStartEnd = () => {
    const tempQuery = startQuery;
    const tempCoords = startCoords;
    setStartQuery(endQuery);
    setStartCoords(endCoords);
    setEndQuery(tempQuery);
    setEndCoords(tempCoords);
  };

  const handleUseMyLocation = () => {
    if (userLocation) {
      setStartQuery('My Live GPS Location');
      setStartCoords([userLocation.lat, userLocation.lng]);
      setIsStartDropdownOpen(false);
    } else if (onNearMe) {
      onNearMe();
      setStartQuery('My Live GPS Location');
    }
  };

  const handleSelectPreset = (preset: PopularRoadTripPreset) => {
    setStartQuery(preset.start.name);
    setStartCoords(preset.start.coordinates);
    setEndQuery(preset.destination.name);
    setEndCoords(preset.destination.coordinates);
    setCorridorMiles(preset.corridorMiles);
    handleCalculateTrip(
      preset.start.coordinates,
      preset.start.name,
      preset.destination.coordinates,
      preset.destination.name,
      preset.corridorMiles
    );
  };

  const handleCalculateTrip = async (
    customStartCoords?: [number, number],
    customStartTitle?: string,
    customEndCoords?: [number, number],
    customEndTitle?: string,
    customCorridor?: number
  ) => {
    setTripError(null);

    // 1. Resolve Start Coordinates
    let resolvedStart: [number, number] | null = customStartCoords || startCoords;
    let startLabel = (customStartTitle || startQuery).trim();

    if (!resolvedStart) {
      if (startLabel.toLowerCase() === 'my live gps location' || startLabel.toLowerCase() === 'my location') {
        if (userLocation) {
          resolvedStart = [userLocation.lat, userLocation.lng];
          startLabel = 'My Live GPS Location';
        } else {
          setTripError('GPS location is still detecting. Please enter a city or address.');
          return;
        }
      } else {
        const geo = await geocodeArea(startLabel);
        if (!geo) {
          setTripError(`Could not find location for "${startLabel}". Please select from suggestions.`);
          return;
        }
        resolvedStart = geo.center;
        startLabel = geo.displayName || startLabel;
      }
    }

    // 2. Resolve Destination Coordinates
    let resolvedEnd: [number, number] | null = customEndCoords || endCoords;
    let endLabel = (customEndTitle || endQuery).trim();

    if (!resolvedEnd) {
      if (!endLabel) {
        setTripError('Please enter a destination city, park, or address.');
        return;
      }
      const geo = await geocodeArea(endLabel);
      if (!geo) {
        setTripError(`Could not find destination "${endLabel}". Please select from suggestions.`);
        return;
      }
      resolvedEnd = geo.center;
      endLabel = geo.displayName || endLabel;
    }

    const effectiveCorridor = customCorridor || corridorMiles;

    // 3. Compute real highway route via OSRM
    setIsCalculatingTrip(true);
    try {
      const routeRes = await calculateRoute(resolvedStart, resolvedEnd);
      if (!routeRes || !routeRes.coordinates || routeRes.coordinates.length < 2) {
        setTripError('Could not compute a driving route between these two points.');
        return;
      }

      if (onSelectTripRoute) {
        onSelectTripRoute({
          origin: {
            title: startLabel,
            coordinates: resolvedStart,
          },
          destination: {
            title: endLabel,
            coordinates: resolvedEnd,
          },
          corridorMiles: effectiveCorridor,
          routeCoordinates: routeRes.coordinates,
          summary: routeRes.summary,
          distanceMiles: routeRes.distanceMiles,
          durationMinutes: routeRes.durationMinutes,
          formattedDuration: routeRes.formattedDuration,
        });
      }

      setIsTripPlannerOpen(false);
    } catch (err: any) {
      setTripError(err?.message || 'Failed to calculate driving route corridor.');
    } finally {
      setIsCalculatingTrip(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative z-[110] ${className}`}>
      {/* 1. Active Road Trip Pill (When Corridor Search is active) */}
      {activeTripRoute ? (
        <div className="bg-white/95 backdrop-blur-xl rounded-full border border-roo-300/90 shadow-[0_4px_20px_rgba(255,90,31,0.12)] flex items-center px-3 py-1.5 sm:py-2 gap-2 w-full">
          <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-roo-500 text-white shrink-0 shadow-xs">
            <Milestone className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0 flex items-center gap-1.5 overflow-hidden">
            <span className="text-xs sm:text-sm font-black text-dark-950 truncate max-w-[100px] sm:max-w-[140px]">
              {activeTripRoute.origin.title}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-roo-500 shrink-0" />
            <span className="text-xs sm:text-sm font-black text-dark-950 truncate max-w-[100px] sm:max-w-[140px]">
              {activeTripRoute.destination.title}
            </span>
            <span className="hidden md:inline-flex text-[10px] font-extrabold text-roo-700 bg-roo-50 px-2 py-0.5 rounded-full border border-roo-200 shrink-0">
              {activeTripRoute.distanceMiles} mi · ±{activeTripRoute.corridorMiles} mi corridor
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setIsTripPlannerOpen(true)}
              className="px-2.5 py-1 rounded-full bg-dark-100 hover:bg-dark-200 text-dark-800 text-xs font-black transition-all"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => {
                if (onClearTripRoute) onClearTripRoute();
              }}
              className="p-1 sm:p-1.5 rounded-full hover:bg-dark-100 text-dark-400 hover:text-dark-800 transition-colors shrink-0"
              title="Exit Road Trip Route"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* 2. Standard Area Search Bar with Road Trip Button */
        <form
          onSubmit={handleFormSubmit}
          className="bg-white/95 backdrop-blur-xl rounded-full border border-dark-200/90 hover:border-dark-400/80 shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_6px_24px_rgba(0,0,0,0.12)] transition-all flex items-center px-2.5 py-1.5 sm:py-2 gap-2 w-full"
        >
          <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-roo-500 text-white shrink-0 shadow-xs">
            {isGeocoding ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Search className="w-3.5 h-3.5 stroke-[2.5]" />
            )}
          </div>

          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setIsOpen(true);
              setHighlightedIndex(-1);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-xs sm:text-sm font-bold text-dark-950 placeholder:text-dark-400 placeholder:font-normal focus:outline-none min-w-0"
          />

          {value && (
            <button
              type="button"
              onClick={() => {
                onClear();
                inputRef.current?.focus();
              }}
              className="p-1 sm:p-1.5 rounded-full hover:bg-dark-100 text-dark-400 hover:text-dark-800 transition-colors shrink-0"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {onNearMe && (
            <button
              type="button"
              onClick={onNearMe}
              disabled={isLocating}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 hover:bg-blue-100 border border-blue-200/80 text-blue-700 text-xs font-black shrink-0 transition-all shadow-2xs"
              title="Search near my live GPS location"
            >
              {isLocating ? (
                <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
              ) : (
                <Navigation className="w-3 h-3 text-blue-600 fill-blue-600" />
              )}
              <span className="hidden sm:inline">{isLocating ? 'Locating...' : 'Near Me'}</span>
            </button>
          )}

          {/* Road Trip Switcher Button */}
          <button
            type="button"
            onClick={() => setIsTripPlannerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-roo-500 to-amber-500 hover:from-roo-600 hover:to-amber-600 text-white text-xs font-black shadow-xs transition-all shrink-0 active:scale-95 cursor-pointer"
            title="Search parks & free campsites along a road trip"
          >
            <Milestone className="w-3.5 h-3.5 text-white" />
            <span className="hidden sm:inline">Road Trip</span>
          </button>
        </form>
      )}

      {/* Floating Single Search Suggestions Dropdown */}
      <AnimatePresence>
        {!activeTripRoute && isOpen && suggestions.length > 0 && (
          <>
            <div
              className="fixed inset-0 bg-black/20 backdrop-blur-xs z-[9990] md:hidden"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-x-3 top-16 sm:absolute sm:top-full sm:left-0 sm:right-0 sm:inset-x-auto sm:top-auto sm:mt-2 bg-white rounded-3xl border border-dark-200/90 shadow-[0_20px_60px_rgba(0,0,0,0.22)] overflow-hidden divide-y divide-dark-100 max-h-[72vh] sm:max-h-96 overflow-y-auto custom-scrollbar z-[9999]"
            >
            <div className="p-2 space-y-1 bg-white">
              {/* Dynamic Road Trip "X to Y" Recognition */}
              {(() => {
                const tripMatch = value.match(/(.+?)\s+(?:to|->)\s+(.+)/i);
                if (!tripMatch) return null;
                const startPart = tripMatch[1].trim();
                const endPart = tripMatch[2].trim();
                if (!startPart || !endPart) return null;
                return (
                  <button
                    type="button"
                    onClick={() => {
                      setStartQuery(startPart);
                      setStartCoords(null);
                      setEndQuery(endPart);
                      setEndCoords(null);
                      setIsOpen(false);
                      setIsTripPlannerOpen(true);
                      handleCalculateTrip(undefined, startPart, undefined, endPart);
                    }}
                    className="w-full text-left px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-roo-50 via-amber-50 to-white hover:from-roo-100 hover:via-amber-100 hover:to-white border border-roo-200 transition-all flex items-center gap-3 cursor-pointer shadow-2xs mb-1"
                  >
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br from-roo-500 to-amber-500 text-white shadow-xs">
                      <Milestone className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs sm:text-sm font-extrabold text-dark-950 flex items-center gap-1.5 truncate">
                        <span>Road Trip:</span>
                        <span className="text-roo-600">{startPart}</span>
                        <span className="text-dark-400">➔</span>
                        <span className="text-roo-600">{endPart}</span>
                      </div>
                      <div className="text-[10px] text-dark-600 font-medium">
                        Order spots along highway with arrival times
                      </div>
                    </div>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-roo-500 text-white shadow-2xs shrink-0">
                      PLAN TRIP
                    </span>
                  </button>
                );
              })()}

              <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-dark-500 flex items-center justify-between">
                <span>Suggested Destinations & Cities</span>
                <span className="text-dark-400 font-bold flex items-center gap-1">
                  {isFetchingLive && <Loader2 className="w-2.5 h-2.5 animate-spin text-roo-500" />}
                  <span>{suggestions.length} places</span>
                </span>
              </div>

              {suggestions.map((sug, idx) => {
                const isSelected = idx === highlightedIndex;
                let Icon = MapPin;
                let iconColor = 'text-roo-600 bg-roo-100';
                let tagColor = 'bg-roo-50 text-roo-800 border-roo-200';
                if (sug.type === 'state') {
                  Icon = Mountain;
                  iconColor = 'text-amber-700 bg-amber-100';
                  tagColor = 'bg-amber-50 text-amber-900 border-amber-200';
                } else if (sug.type === 'spot') {
                  Icon = Tent;
                  iconColor = 'text-blue-700 bg-blue-100';
                  tagColor = 'bg-blue-50 text-blue-900 border-blue-200';
                } else if (sug.type === 'area') {
                  Icon = Trees;
                  iconColor = 'text-emerald-700 bg-emerald-100';
                  tagColor = 'bg-emerald-50 text-emerald-900 border-emerald-200';
                } else if (sug.type === 'city') {
                  Icon = Building2;
                  iconColor = 'text-indigo-700 bg-indigo-100';
                  tagColor = 'bg-indigo-50 text-indigo-900 border-indigo-200';
                }

                return (
                  <button
                    key={sug.id}
                    type="button"
                    onClick={() => handleSelectSuggestion(sug)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-2xl transition-all flex items-center gap-3 cursor-pointer ${
                      isSelected ? 'bg-dark-900 text-white' : 'hover:bg-dark-100/80 text-dark-950'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconColor} ${isSelected ? 'bg-white/20 text-white' : ''}`}>
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs sm:text-sm font-extrabold truncate ${isSelected ? 'text-white' : 'text-dark-950'}`}>
                        {sug.title}
                      </div>
                      <div className={`text-[11px] truncate font-medium ${isSelected ? 'text-dark-300' : 'text-dark-600'}`}>
                        {sug.subtitle}
                      </div>
                    </div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border shrink-0 ${
                      isSelected ? 'bg-white/20 text-white border-white/30' : tagColor
                    }`}>
                      {sug.type.toUpperCase()}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>

      {/* 3. Road Trip Corridor Planner Overlay */}
      <AnimatePresence>
        {isTripPlannerOpen && (
          <div className="fixed inset-0 z-[10000] flex items-start justify-center pt-16 sm:pt-20 px-3 bg-black/40 backdrop-blur-xs animate-fade-in">
            <motion.div
              ref={tripPlannerRef}
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className="w-full max-w-lg bg-white rounded-3xl border border-dark-200/90 shadow-[0_25px_70px_rgba(0,0,0,0.3)] overflow-hidden divide-y divide-dark-100"
            >
              {/* Header */}
              <div className="px-5 py-4 flex items-center justify-between bg-gradient-to-r from-roo-50 via-white to-white">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-roo-500 text-white flex items-center justify-center shadow-xs">
                    <Milestone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-dark-950 leading-tight">
                      Road Trip Corridor Search
                    </h3>
                    <p className="text-[11px] text-dark-500 font-medium">
                      Find public parks & free campsites along your route
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTripPlannerOpen(false)}
                  className="p-1.5 rounded-full text-dark-400 hover:text-dark-800 hover:bg-dark-100 transition-colors cursor-pointer"
                  title="Close planner"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Input Rows */}
              <div className="p-4 sm:p-5 space-y-3.5 max-h-[78vh] overflow-y-auto custom-scrollbar">
                {/* Popular Scenic Road Trips Quick Presets */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-dark-500">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Popular Scenic Road Trips (1-Click)</span>
                    </span>
                    <span className="text-[10px] text-dark-400 font-semibold">Tap to load route</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {POPULAR_ROAD_TRIP_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        className="p-2 rounded-xl bg-dark-50 hover:bg-roo-50 border border-dark-200/80 hover:border-roo-300 text-left transition-all active:scale-95 cursor-pointer group"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{preset.icon}</span>
                          <span className="text-xs font-black text-dark-950 group-hover:text-roo-600 truncate">
                            {preset.title}
                          </span>
                        </div>
                        <div className="text-[10px] text-dark-500 truncate mt-0.5">{preset.tagline}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Start Location */}
                <div className="space-y-1.5 relative">
                  <div className="flex items-center justify-between text-xs font-bold text-dark-700">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                      <span>Start Point</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleUseMyLocation}
                      className="text-[11px] font-black text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-0.5 rounded-full transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Navigation className="w-3 h-3 text-blue-600 fill-blue-600" />
                      <span>Use My Location</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={startQuery}
                      onChange={(e) => {
                        setStartQuery(e.target.value);
                        setStartCoords(null);
                        setIsStartDropdownOpen(true);
                      }}
                      onFocus={() => setIsStartDropdownOpen(true)}
                      placeholder="Start city or address (e.g. Denver, Seattle)..."
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-dark-50 border border-dark-200 text-xs sm:text-sm font-bold text-dark-950 placeholder:text-dark-400 focus:outline-none focus:ring-2 focus:ring-roo-500 focus:bg-white transition-all"
                    />
                    {startQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setStartQuery('');
                          setStartCoords(null);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-800"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Start Dropdown Suggestions */}
                  {isStartDropdownOpen && startSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl border border-dark-200 shadow-xl overflow-hidden z-50 divide-y divide-dark-100 max-h-44 overflow-y-auto">
                      {startSuggestions.map((sug) => (
                        <button
                          key={sug.id}
                          type="button"
                          onClick={() => {
                            setStartQuery(sug.title);
                            setStartCoords(sug.center);
                            setIsStartDropdownOpen(false);
                          }}
                          className="w-full text-left px-3.5 py-2 hover:bg-dark-50 transition-colors flex items-center justify-between cursor-pointer"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-black text-dark-950 truncate">{sug.title}</div>
                            <div className="text-[10px] text-dark-500 truncate">{sug.subtitle}</div>
                          </div>
                          <span className="text-[9px] font-black text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-full shrink-0">
                            {sug.type.toUpperCase()}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Departure time indicator */}
                  <div className="flex items-center gap-1.5 text-[11px] text-dark-500 font-semibold px-1 pt-0.5">
                    <Clock className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>Leaving:</span>
                    <span className="text-dark-950 font-black">Now</span>
                    <span className="text-dark-400">·</span>
                    <span className="text-dark-600 truncate">Calculates arrival time for every stop in order</span>
                  </div>
                </div>

                {/* Swap Start & End Button */}
                <div className="flex justify-center -my-1">
                  <button
                    type="button"
                    onClick={handleSwapStartEnd}
                    className="p-1.5 rounded-full bg-dark-100 hover:bg-dark-200 text-dark-600 transition-all hover:scale-110 active:scale-95 shadow-2xs cursor-pointer"
                    title="Swap Start & Destination"
                  >
                    <ArrowUpDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Destination (End Point) */}
                <div className="space-y-1.5 relative">
                  <div className="flex items-center justify-between text-xs font-bold text-dark-700">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-roo-500 ring-4 ring-roo-100" />
                      <span>Destination (End Point)</span>
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={endQuery}
                      onChange={(e) => {
                        setEndQuery(e.target.value);
                        setEndCoords(null);
                        setIsEndDropdownOpen(true);
                      }}
                      onFocus={() => setIsEndDropdownOpen(true)}
                      placeholder="Destination city, park, or forest (e.g. Yellowstone, Moab, Tahoe)..."
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-dark-50 border border-dark-200 text-xs sm:text-sm font-bold text-dark-950 placeholder:text-dark-400 focus:outline-none focus:ring-2 focus:ring-roo-500 focus:bg-white transition-all"
                    />
                    {endQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setEndQuery('');
                          setEndCoords(null);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-800"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* End Dropdown Suggestions */}
                  {isEndDropdownOpen && endSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl border border-dark-200 shadow-xl overflow-hidden z-50 divide-y divide-dark-100 max-h-44 overflow-y-auto">
                      {endSuggestions.map((sug) => (
                        <button
                          key={sug.id}
                          type="button"
                          onClick={() => {
                            setEndQuery(sug.title);
                            setEndCoords(sug.center);
                            setIsEndDropdownOpen(false);
                          }}
                          className="w-full text-left px-3.5 py-2 hover:bg-dark-50 transition-colors flex items-center justify-between cursor-pointer"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-black text-dark-950 truncate">{sug.title}</div>
                            <div className="text-[10px] text-dark-500 truncate">{sug.subtitle}</div>
                          </div>
                          <span className="text-[9px] font-black text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-full shrink-0">
                            {sug.type.toUpperCase()}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Corridor Width Selector */}
                <div className="pt-1">
                  <label className="text-[11px] font-black uppercase tracking-wider text-dark-500 block mb-1.5">
                    Search Corridor Width Off Highway:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { mi: 15, label: '15 miles', desc: 'Direct Highway' },
                      { mi: 25, label: '25 miles', desc: 'Standard (Best)' },
                      { mi: 50, label: '50 miles', desc: 'Wide Explorer' },
                    ].map((opt) => (
                      <button
                        key={opt.mi}
                        type="button"
                        onClick={() => setCorridorMiles(opt.mi)}
                        className={`px-2 py-2 rounded-2xl border text-center transition-all cursor-pointer ${
                          corridorMiles === opt.mi
                            ? 'bg-roo-50 border-roo-500 text-roo-950 ring-2 ring-roo-500/20 shadow-xs font-black'
                            : 'bg-white border-dark-200 hover:border-dark-300 text-dark-700 font-bold'
                        }`}
                      >
                        <div className="text-xs">{opt.label}</div>
                        <div className="text-[10px] text-dark-500 font-medium">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Error Banner */}
                {tripError && (
                  <div className="p-2.5 rounded-2xl bg-red-50 border border-red-200 text-xs font-bold text-red-700 flex items-center gap-1.5">
                    <X className="w-3.5 h-3.5 shrink-0" />
                    <span>{tripError}</span>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="px-5 py-3.5 bg-dark-50/50 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsTripPlannerOpen(false)}
                  className="px-4 py-2 rounded-2xl text-xs font-bold text-dark-600 hover:text-dark-900 hover:bg-dark-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleCalculateTrip()}
                  disabled={isCalculatingTrip || !endQuery.trim()}
                  className="px-5 py-2.5 rounded-2xl bg-roo-500 hover:bg-roo-600 active:scale-95 disabled:opacity-50 text-white text-xs font-black shadow-md flex items-center gap-2 transition-all cursor-pointer"
                >
                  {isCalculatingTrip ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Routing & Finding Havens...</span>
                    </>
                  ) : (
                    <>
                      <Milestone className="w-3.5 h-3.5" />
                      <span>Find Havens on Route</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
