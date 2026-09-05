import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { Spot } from '../../types';
import { InteractiveMap } from '../explore/InteractiveMap';
import { UberRouteDrawer } from '../explore/UberRouteDrawer';
import {
  RouteOrigin,
  RouteResult,
  DEFAULT_ORIGINS,
  calculateRoute,
  calculateHaversineDistanceMiles,
  formatDuration
} from '../../lib/routeService';
import {
  Compass,
  Navigation,
  MapPin,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check,
  SlidersHorizontal,
  Zap,
  Dog,
  Maximize2
} from 'lucide-react';

interface HomeMapSectionProps {
  onRequestStay: (spot: Spot) => void;
}

export const HomeMapSection: React.FC<HomeMapSectionProps> = ({ onRequestStay }) => {
  const { spots, setSelectedSpotId, setCurrentView } = useApp();

  const [origin, setOrigin] = useState<RouteOrigin>(DEFAULT_ORIGINS[0]);
  const [routedSpot, setRoutedSpot] = useState<Spot | null>(null);
  const [activeRoute, setActiveRoute] = useState<RouteResult | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [isSimulatingDrive, setIsSimulatingDrive] = useState(false);
  const [hoveredSpotId, setHoveredSpotId] = useState<string | null>(null);

  // Quick filter filters for the nearby list
  const [filterMode, setFilterMode] = useState<'all' | '30ft' | 'hookups' | 'pets'>('all');

  // Compute distance for all spots from the current origin and sort by proximity
  const sortedNearbySpots = useMemo(() => {
    const withDistance = spots.map(spot => {
      const dist = calculateHaversineDistanceMiles(origin.coordinates, spot.coordinates);
      // Approximate driving road distance (~1.22x)
      const roadDist = Math.round(dist * 1.22 * 10) / 10;
      // Approximate driving duration at 50mph
      const estMinutes = Math.round((roadDist / 50) * 60);
      return {
        ...spot,
        distanceMiles: roadDist,
        estDriveTime: formatDuration(estMinutes),
      };
    });

    // Filter based on active quick filter
    let filtered = withDistance;
    if (filterMode === '30ft') {
      filtered = filtered.filter(s => s.rigCompatibility.maxLengthFt >= 30);
    } else if (filterMode === 'hookups') {
      filtered = filtered.filter(s => s.amenities.electricity !== 'none' || s.amenities.water !== 'none');
    } else if (filterMode === 'pets') {
      filtered = filtered.filter(s => s.amenities.petsAllowed);
    }

    // Sort nearest first
    filtered.sort((a, b) => a.distanceMiles - b.distanceMiles);

    return filtered;
  }, [spots, origin, filterMode]);

  // Take top 25 nearest spots for the home map view
  const visibleHomeSpots = useMemo(() => {
    return sortedNearbySpots.slice(0, 25);
  }, [sortedNearbySpots]);

  // Route calculation handler
  const handleSpotSelect = useCallback(async (spot: Spot) => {
    setRoutedSpot(spot);
    setIsLoadingRoute(true);
    setIsSimulatingDrive(false);
    try {
      const res = await calculateRoute(origin.coordinates, spot.coordinates);
      setActiveRoute(res);
    } catch (err) {
      console.error('Failed to calculate route', err);
    } finally {
      setIsLoadingRoute(false);
    }
  }, [origin]);

  const handleChangeOrigin = (newOrigin: RouteOrigin) => {
    setOrigin(newOrigin);
    if (routedSpot) {
      handleSpotSelect(routedSpot);
    }
  };

  const handleClearRoute = () => {
    setRoutedSpot(null);
    setActiveRoute(null);
    setIsSimulatingDrive(false);
  };

  const handleNavigateToDetails = (spotId: string) => {
    setSelectedSpotId(spotId);
    setCurrentView('spot-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section id="home-map-section" className="py-14 sm:py-20 bg-cream-50 relative overflow-hidden border-y border-dark-200/80">
      {/* Subtle ambient gradient */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-roo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-roo-100/70 border border-roo-200 text-roo-800 text-xs font-black uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5 text-roo-600" />
              <span>LIVE SMART RADAR · FREE RV HAVENS</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-dark-900 tracking-tight leading-tight">
              Free Spots Near You &{' '}
              <span className="text-roo-500">Live Uber Route Preview</span>
            </h2>
            <p className="text-sm sm:text-base text-dark-600 mt-2 max-w-2xl font-normal">
              Click any spot to calculate your real RV driving path, estimated drive time, fuel cost, and turn-by-turn navigation.
            </p>
          </div>

          {/* Quick Hub Selector & Full Screen Explore Button */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setCurrentView('explore');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-4 py-2 rounded-2xl bg-dark-900 hover:bg-black text-white text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
            >
              <span>Explore All 9,700+ on Map</span>
              <ArrowRight className="w-3.5 h-3.5 text-roo-400" />
            </button>
          </div>
        </div>

        {/* Quick Filter Badges Bar */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              filterMode === 'all'
                ? 'bg-dark-900 text-white shadow-sm'
                : 'bg-white text-dark-700 hover:bg-dark-100 border border-dark-200'
            }`}
          >
            Nearest Havens
          </button>
          <button
            onClick={() => setFilterMode('30ft')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterMode === '30ft'
                ? 'bg-dark-900 text-white shadow-sm'
                : 'bg-white text-dark-700 hover:bg-dark-100 border border-dark-200'
            }`}
          >
            <span>Fits 30ft+ Rigs</span>
          </button>
          <button
            onClick={() => setFilterMode('hookups')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterMode === 'hookups'
                ? 'bg-dark-900 text-white shadow-sm'
                : 'bg-white text-dark-700 hover:bg-dark-100 border border-dark-200'
            }`}
          >
            <Zap className="w-3 h-3 text-amber-500" />
            <span>With Hookups</span>
          </button>
          <button
            onClick={() => setFilterMode('pets')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterMode === 'pets'
                ? 'bg-dark-900 text-white shadow-sm'
                : 'bg-white text-dark-700 hover:bg-dark-100 border border-dark-200'
            }`}
          >
            <Dog className="w-3 h-3 text-emerald-600" />
            <span>Pet Friendly</span>
          </button>
        </div>

        {/* Main Split Layout: Left Feed + Right Live Map */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Nearby Spot Cards */}
          <div className="lg:col-span-5 flex flex-col gap-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            <div className="flex items-center justify-between px-1 text-xs font-bold text-dark-600">
              <span>{visibleHomeSpots.length} Havens near {origin.name}</span>
              <span className="text-emerald-700 font-extrabold">100% Free Stays</span>
            </div>

            {visibleHomeSpots.map(spot => {
              const isSelected = routedSpot?.id === spot.id;
              const isHovered = hoveredSpotId === spot.id;

              return (
                <div
                  key={spot.id}
                  onClick={() => handleSpotSelect(spot)}
                  onMouseEnter={() => setHoveredSpotId(spot.id)}
                  onMouseLeave={() => setHoveredSpotId(null)}
                  className={`p-3.5 rounded-3xl border transition-all cursor-pointer flex gap-4 ${
                    isSelected
                      ? 'bg-white border-roo-500 shadow-airbnb ring-2 ring-roo-500/20'
                      : isHovered
                      ? 'bg-white border-dark-300 shadow-md'
                      : 'bg-white/80 hover:bg-white border-dark-200/80 shadow-xs'
                  }`}
                >
                  {/* Photo Thumbnail */}
                  <div className="relative w-28 h-28 shrink-0 rounded-2xl overflow-hidden bg-dark-100">
                    <img
                      src={spot.photos[0]}
                      alt={spot.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute top-1.5 left-1.5 bg-black/70 backdrop-blur-xs text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                      FREE
                    </div>
                  </div>

                  {/* Spot Details & Uber Distance / Drive Time */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                      {/* Distance & Drive Time Pill */}
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-roo-50 text-roo-700 text-[10px] font-extrabold border border-roo-200">
                          <Navigation className="w-2.5 h-2.5 text-roo-500" />
                          <span>{spot.distanceMiles} mi away</span>
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-dark-100 text-dark-700 text-[10px] font-bold">
                          <Clock className="w-2.5 h-2.5 text-dark-500" />
                          <span>~{spot.estDriveTime}</span>
                        </span>
                      </div>

                      <h4 className="text-xs sm:text-sm font-black text-dark-900 truncate">
                        {spot.title}
                      </h4>
                      <p className="text-[11px] text-dark-600 font-medium truncate mt-0.5">
                        {spot.locationName}, {spot.generalArea}
                      </p>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-dark-100">
                      <div className="text-[11px] font-bold text-dark-700 flex items-center gap-2">
                        <span>🚐 Fits {spot.rigCompatibility.maxLengthFt}ft</span>
                        <span>·</span>
                        <span className="text-emerald-700 font-extrabold">★ {spot.rating}</span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSpotSelect(spot);
                        }}
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold transition-colors ${
                          isSelected
                            ? 'bg-roo-500 text-white'
                            : 'bg-dark-100 hover:bg-dark-200 text-dark-900'
                        }`}
                      >
                        {isSelected ? 'Routing Active ✓' : 'See Route →'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Interactive Map with Uber Route Drawer */}
          <div className="lg:col-span-7 h-[600px] relative rounded-4xl overflow-hidden shadow-airbnb border border-dark-200 bg-white">
            <InteractiveMap
              allSpots={spots}
              visibleSpots={visibleHomeSpots}
              hoveredSpotId={hoveredSpotId}
              selectedSpotId={routedSpot ? routedSpot.id : null}
              onSelectSpot={handleSpotSelect}
              activeRoute={activeRoute}
              origin={origin}
              onChangeOrigin={handleChangeOrigin}
              isSimulatingDrive={isSimulatingDrive}
              onSimulationEnd={() => setIsSimulatingDrive(false)}
              className="w-full h-full"
            />

            {/* Uber Route Drawer Overlay */}
            <AnimatePresence>
              {routedSpot && (
                <div className="absolute bottom-4 inset-x-4 sm:inset-x-6 z-[500] pointer-events-none">
                  <UberRouteDrawer
                    spot={routedSpot}
                    originName={origin.name}
                    originCoords={origin.coordinates}
                    route={activeRoute}
                    isLoadingRoute={isLoadingRoute}
                    isSimulating={isSimulatingDrive}
                    onStartSimulation={() => setIsSimulatingDrive(true)}
                    onStopSimulation={() => setIsSimulatingDrive(false)}
                    onClearRoute={handleClearRoute}
                    onRequestStay={onRequestStay}
                    onViewSpotDetails={handleNavigateToDetails}
                  />
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};
