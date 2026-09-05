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
import { getOptimizedImageUrl } from '../../lib/imageOptimizer';
import {
  Search,
  Navigation,
  Clock,
  Sparkles,
  Maximize2,
  Minimize2,
  ChevronRight,
  ChevronLeft,
  SlidersHorizontal,
  Zap,
  Dog,
  Compass,
  ArrowRight,
  X
} from 'lucide-react';

interface HeroMapExperienceProps {
  onRequestStay: (spot: Spot) => void;
}

export const HeroMapExperience: React.FC<HeroMapExperienceProps> = ({ onRequestStay }) => {
  const { spots, setSelectedSpotId, setCurrentView, searchFilters, setSearchFilters } = useApp();

  // Expand / Fullscreen state
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Uber Routing & Origin state
  const [origin, setOrigin] = useState<RouteOrigin>(DEFAULT_ORIGINS[0]);
  const [routedSpot, setRoutedSpot] = useState<Spot | null>(null);
  const [activeRoute, setActiveRoute] = useState<RouteResult | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [isSimulatingDrive, setIsSimulatingDrive] = useState(false);
  const [hoveredSpotId, setHoveredSpotId] = useState<string | null>(null);

  // Quick filter for nearby list
  const [filterMode, setFilterMode] = useState<'all' | '30ft' | 'hookups' | 'pets'>('all');

  // Search query filter
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate distances and sort nearest first
  const nearbySpots = useMemo(() => {
    let list = spots.map(spot => {
      const dist = calculateHaversineDistanceMiles(origin.coordinates, spot.coordinates);
      const roadDist = Math.round(dist * 1.22 * 10) / 10;
      const estMinutes = Math.round((roadDist / 50) * 60);
      return {
        ...spot,
        distanceMiles: roadDist,
        estDriveTime: formatDuration(estMinutes),
      };
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        s =>
          s.title.toLowerCase().includes(q) ||
          s.locationName.toLowerCase().includes(q) ||
          s.generalArea.toLowerCase().includes(q)
      );
    }

    if (filterMode === '30ft') {
      list = list.filter(s => s.rigCompatibility.maxLengthFt >= 30);
    } else if (filterMode === 'hookups') {
      list = list.filter(s => s.amenities.electricity !== 'none' || s.amenities.water !== 'none');
    } else if (filterMode === 'pets') {
      list = list.filter(s => s.amenities.petsAllowed);
    }

    list.sort((a, b) => a.distanceMiles - b.distanceMiles);
    return list;
  }, [spots, origin, filterMode, searchQuery]);

  const visibleNearby = useMemo(() => nearbySpots.slice(0, 30), [nearbySpots]);

  // Handle route calculation
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
    <section
      className={`relative w-full transition-all duration-300 ${
        isExpanded
          ? 'fixed inset-0 z-50 bg-black'
          : 'h-[calc(100vh-80px)] min-h-[580px] sm:min-h-[640px]'
      }`}
    >
      {/* 1. Full-Viewport Interactive Map Canvas */}
      <InteractiveMap
        allSpots={spots}
        visibleSpots={visibleNearby}
        hoveredSpotId={hoveredSpotId}
        selectedSpotId={routedSpot ? routedSpot.id : null}
        onSelectSpot={handleSpotSelect}
        activeRoute={activeRoute}
        origin={origin}
        onChangeOrigin={handleChangeOrigin}
        isSimulatingDrive={isSimulatingDrive}
        onSimulationEnd={() => setIsSimulatingDrive(false)}
        isExpanded={isExpanded}
        onToggleExpand={() => setIsExpanded(!isExpanded)}
        className="w-full h-full rounded-none border-0"
      />

      {/* 2. Top Floating Liquid-Glass Uber Search Bar */}
      <div className="absolute top-4 inset-x-4 sm:inset-x-6 z-[420] pointer-events-none flex justify-center">
        <div className="pointer-events-auto liquid-glass-pill rounded-full p-1.5 sm:p-2 shadow-2xl border border-white/80 max-w-2xl w-full flex items-center justify-between gap-2 backdrop-blur-2xl">
          {/* Search Input */}
          <div className="flex-1 flex items-center gap-2.5 px-3 sm:px-4 py-1">
            <Search className="w-4 h-4 text-roo-500 shrink-0 stroke-[2.5]" />
            <input
              type="text"
              placeholder="Search Moab, Sedona, Bend, Smokies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs sm:text-sm font-bold text-dark-900 placeholder:text-dark-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-1 rounded-full hover:bg-dark-100 text-dark-500"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Hub Badge */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-dark-100 text-dark-800 text-xs font-extrabold border border-dark-200">
            <span>🚐</span>
            <span className="truncate max-w-[120px]">{origin.name}</span>
          </div>

          {/* Expand Fullscreen Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 sm:px-3 sm:py-1.5 rounded-full bg-dark-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm shrink-0"
            title={isExpanded ? 'Collapse Map' : 'Expand to Fullscreen'}
          >
            {isExpanded ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-roo-400" />
                <span className="hidden sm:inline">Minimize</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-roo-400" />
                <span className="hidden sm:inline">Expand Map</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3. Left Floating Nearby Spots Radar Drawer (Uber Style) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="absolute top-20 left-4 sm:left-6 bottom-6 z-[410] w-[340px] sm:w-[380px] pointer-events-none flex flex-col"
          >
            <div className="pointer-events-auto bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-dark-200/90 flex flex-col flex-1 overflow-hidden">
              {/* Drawer Header */}
              <div className="p-4 border-b border-dark-100 bg-dark-900 text-white flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-roo-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Free RV Havens Near You</span>
                  </div>
                  <div className="text-xs font-black text-white mt-0.5 truncate">
                    {nearbySpots.length} Spots near {origin.name}
                  </div>
                </div>

                <button
                  onClick={() => setIsSidebarOpen(false)}
                  title="Minimize list"
                  className="p-1 rounded-full text-dark-400 hover:text-white hover:bg-dark-800 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Filter Badges */}
              <div className="p-2 border-b border-dark-100 flex items-center gap-1 overflow-x-auto bg-dark-50/70">
                <button
                  onClick={() => setFilterMode('all')}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 transition-colors ${
                    filterMode === 'all'
                      ? 'bg-dark-900 text-white'
                      : 'bg-white text-dark-700 hover:bg-dark-100 border border-dark-200'
                  }`}
                >
                  Nearest
                </button>
                <button
                  onClick={() => setFilterMode('30ft')}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 transition-colors ${
                    filterMode === '30ft'
                      ? 'bg-dark-900 text-white'
                      : 'bg-white text-dark-700 hover:bg-dark-100 border border-dark-200'
                  }`}
                >
                  30ft+ Fit
                </button>
                <button
                  onClick={() => setFilterMode('hookups')}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 transition-colors flex items-center gap-1 ${
                    filterMode === 'hookups'
                      ? 'bg-dark-900 text-white'
                      : 'bg-white text-dark-700 hover:bg-dark-100 border border-dark-200'
                  }`}
                >
                  <Zap className="w-2.5 h-2.5 text-amber-500" />
                  <span>Hookups</span>
                </button>
                <button
                  onClick={() => setFilterMode('pets')}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 transition-colors flex items-center gap-1 ${
                    filterMode === 'pets'
                      ? 'bg-dark-900 text-white'
                      : 'bg-white text-dark-700 hover:bg-dark-100 border border-dark-200'
                  }`}
                >
                  <Dog className="w-2.5 h-2.5 text-emerald-600" />
                  <span>Pets</span>
                </button>
              </div>

              {/* Scrollable Spots Feed */}
              <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 custom-scrollbar">
                {visibleNearby.map(spot => {
                  const isSelected = routedSpot?.id === spot.id;
                  const isHovered = hoveredSpotId === spot.id;

                  return (
                    <div
                      key={spot.id}
                      onClick={() => handleSpotSelect(spot)}
                      onMouseEnter={() => setHoveredSpotId(spot.id)}
                      onMouseLeave={() => setHoveredSpotId(null)}
                      className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex gap-3 ${
                        isSelected
                          ? 'bg-white border-roo-500 shadow-lg ring-2 ring-roo-500/20'
                          : isHovered
                          ? 'bg-white border-dark-300 shadow-md'
                          : 'bg-white/80 hover:bg-white border-dark-200/80 shadow-2xs'
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-dark-100">
                        <img
                          src={getOptimizedImageUrl(spot.photos[0], { width: 200, quality: 75 })}
                          alt={spot.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (!target.src.includes('real_bald_mountain')) {
                              target.src = '/images/real_bald_mountain.jpg';
                            }
                          }}
                        />
                        <div className="absolute top-1 left-1 bg-black/70 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full">
                          FREE
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[10px] font-extrabold text-roo-600 bg-roo-50 px-1.5 py-0.5 rounded-md border border-roo-200">
                              {spot.distanceMiles} mi
                            </span>
                            <span className="text-[10px] font-semibold text-dark-500">
                              ~{spot.estDriveTime}
                            </span>
                          </div>
                          <h4 className="text-xs font-black text-dark-900 truncate">
                            {spot.title}
                          </h4>
                          <p className="text-[10px] text-dark-600 truncate">
                            {spot.locationName}, {spot.generalArea}
                          </p>
                        </div>

                        <div className="flex items-center justify-between text-[10px] font-bold text-dark-700 pt-1 border-t border-dark-100">
                          <span>Max {spot.rigCompatibility.maxLengthFt}ft</span>
                          <span className="text-emerald-700 font-extrabold">★ {spot.rating}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Drawer Footer */}
              <div className="p-3 border-t border-dark-100 bg-dark-50 flex items-center justify-between">
                <button
                  onClick={() => {
                    setCurrentView('explore');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-dark-900 hover:bg-black text-white text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Explore All 9,700+ Free Havens</span>
                  <ArrowRight className="w-3.5 h-3.5 text-roo-400" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Minimized Sidebar Reopen Pill */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="absolute top-20 left-4 z-[410] liquid-glass-pill px-3 py-2 rounded-2xl text-xs font-black text-dark-900 flex items-center gap-2 shadow-xl border border-dark-200 hover:bg-white transition-all"
        >
          <ChevronRight className="w-4 h-4 text-roo-500" />
          <span>Show Nearby Spots ({nearbySpots.length})</span>
        </button>
      )}

      {/* 4. Uber Route Drawer Overlay (Docked Bottom Right / Center when a route is active) */}
      <AnimatePresence>
        {routedSpot && (
          <div className="absolute bottom-6 right-4 sm:right-6 z-[500] w-full max-w-sm sm:max-w-md pointer-events-none">
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
    </section>
  );
};
