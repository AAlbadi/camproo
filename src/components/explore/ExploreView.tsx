import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { SpotCard } from './SpotCard';
import { FilterPanel } from './FilterPanel';
import { InteractiveMap, MapBounds } from './InteractiveMap';
import { CategoryBar } from '../common/CategoryBar';
import { Spot } from '../../types';
import {
  Map as MapIcon,
  List as ListIcon,
  X,
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
  Layers,
  Compass
} from 'lucide-react';

interface ExploreViewProps {
  onRequestStay: (spot: Spot) => void;
}

export const ExploreView: React.FC<ExploreViewProps> = ({ onRequestStay }) => {
  const {
    spots,
    users,
    searchFilters,
    setSelectedSpotId,
    setCurrentView,
    resetFilters
  } = useApp();

  const [hoveredSpotId, setHoveredSpotId] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchFilters.locationQuery) count++;
    if (searchFilters.rvType !== 'any') count++;
    if (searchFilters.electricRequired !== 'any') count++;
    if (searchFilters.waterRequired) count++;
    if (searchFilters.sewerRequired) count++;
    if (searchFilters.wifiRequired) count++;
    if (searchFilters.petsAllowed) count++;
    if (searchFilters.campfireAllowed) count++;
    if (searchFilters.generatorAllowed) count++;
    if (searchFilters.familyFriendlyOnly) count++;
    if (searchFilters.quietOnly) count++;
    if (searchFilters.offGridOnly) count++;
    if (searchFilters.pullThroughOnly) count++;
    if (searchFilters.levelGroundOnly) count++;
    if (searchFilters.environments.length > 0) count += searchFilters.environments.length;
    return count;
  }, [searchFilters]);

  // Filter spots logic (by user search filters)
  const filteredSpots = useMemo(() => {
    return spots.filter(spot => {
      // Location
      if (searchFilters.locationQuery.trim()) {
        const q = searchFilters.locationQuery.toLowerCase();
        const match =
          spot.locationName.toLowerCase().includes(q) ||
          spot.generalArea.toLowerCase().includes(q) ||
          spot.title.toLowerCase().includes(q);
        if (!match) return false;
      }

      // RV Length (only filter if user narrowed down their required vehicle length)
      if (searchFilters.maxLengthFt && searchFilters.maxLengthFt < 45) {
        if (spot.rigCompatibility && spot.rigCompatibility.maxLengthFt && spot.rigCompatibility.maxLengthFt < searchFilters.maxLengthFt) {
          return false;
        }
      }

      // RV Type
      if (searchFilters.rvType !== 'any') {
        if (!spot.rigCompatibility.acceptedTypes.includes(searchFilters.rvType)) {
          return false;
        }
      }

      // Hookups
      if (searchFilters.electricRequired === '30amp') {
        if (spot.amenities.electricity !== '30amp' && spot.amenities.electricity !== '50amp') {
          return false;
        }
      }
      if (searchFilters.waterRequired && spot.amenities.water === 'none') return false;
      if (searchFilters.sewerRequired && spot.amenities.sewer === 'none') return false;
      if (searchFilters.wifiRequired && !spot.amenities.wifi) return false;

      // Atmosphere & Policies
      if (searchFilters.petsAllowed && !spot.amenities.petsAllowed) return false;
      if (searchFilters.campfireAllowed && !spot.amenities.firePit) return false;
      if (searchFilters.generatorAllowed && !spot.amenities.generatorsAllowed) return false;
      if (searchFilters.familyFriendlyOnly && !spot.amenities.familyFriendly) return false;
      if (searchFilters.quietOnly && !spot.amenities.quietSetting) return false;
      if (searchFilters.offGridOnly && !spot.amenities.offGridCapable) return false;
      if (searchFilters.pullThroughOnly && spot.rigCompatibility.accessType !== 'pull_through') return false;
      if (searchFilters.levelGroundOnly && !spot.rigCompatibility.isLevel) return false;

      // Environments
      if (searchFilters.environments.length > 0) {
        if (!searchFilters.environments.includes(spot.environment)) return false;
      }

      return true;
    });
  }, [spots, searchFilters]);

  // Airbnb Map-Bounded Spots Logic: filter down to spots currently visible in viewport when map is open
  const spotsInMapBounds = useMemo(() => {
    if (!mapBounds || !showMap) return filteredSpots;
    const minLat = Math.min(mapBounds.southWest.lat, mapBounds.northEast.lat);
    const maxLat = Math.max(mapBounds.southWest.lat, mapBounds.northEast.lat);
    const minLng = Math.min(mapBounds.southWest.lng, mapBounds.northEast.lng);
    const maxLng = Math.max(mapBounds.southWest.lng, mapBounds.northEast.lng);

    return filteredSpots.filter(spot => {
      const [lat, lng] = spot.coordinates;
      return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
    });
  }, [filteredSpots, mapBounds, showMap]);

  const handleSelectSpot = (id: string) => {
    setSelectedSpotId(id);
    setCurrentView('spot-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const displayedSpotsInSplit = spotsInMapBounds.length > 0 ? spotsInMapBounds : filteredSpots;

  return (
    <div className="min-h-screen pb-24">
      {/* Airbnb Category Bar Sticky Header */}
      <CategoryBar
        onOpenFilters={() => setShowFiltersModal(true)}
        activeFilterCount={activeFilterCount}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* If Map is Open: Show Split View on Desktop */}
        {showMap ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Scrollable Spot Cards */}
            <div className="lg:col-span-6 flex flex-col gap-3 max-h-[calc(100vh-160px)] overflow-y-auto pr-2">
              <div className="flex items-center justify-between px-1 py-1">
                <span className="text-xs font-bold text-dark-700">
                  {spotsInMapBounds.length} {spotsInMapBounds.length === 1 ? 'spot' : 'spots'} visible on map
                </span>
                {mapBounds && spotsInMapBounds.length !== filteredSpots.length && (
                  <button
                    onClick={() => setMapBounds(null)}
                    className="text-[11px] font-bold text-roo-500 hover:text-roo-600 underline"
                  >
                    Reset bounds ({filteredSpots.length} total)
                  </button>
                )}
              </div>

              {displayedSpotsInSplit.length === 0 ? (
                <div className="bg-white rounded-3xl p-10 text-center border border-dark-200">
                  <p className="text-xs text-dark-600">No spots in this map boundary. Pan or zoom to see nearby spots.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {displayedSpotsInSplit.map(spot => {
                    const host = users.find(u => u.id === spot.hostId);
                    return (
                      <SpotCard
                        key={spot.id}
                        spot={spot}
                        host={host}
                        isHovered={hoveredSpotId === spot.id}
                        onHover={setHoveredSpotId}
                        onSelect={handleSelectSpot}
                        onRequest={onRequestStay}
                      />
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: Sticky Map with Airbnb Search as I Move Logic */}
            <div className="lg:col-span-6 lg:sticky lg:top-36 h-[calc(100vh-180px)] rounded-3xl overflow-hidden shadow-airbnb">
              <InteractiveMap
                allSpots={filteredSpots}
                visibleSpots={spotsInMapBounds}
                hoveredSpotId={hoveredSpotId}
                selectedSpotId={null}
                onSelectSpot={handleSelectSpot}
                onBoundsChange={setMapBounds}
                className="w-full h-full"
              />
            </div>
          </div>
        ) : (
          /* Normal Full Width Grid View */
          <div>
            {filteredSpots.length === 0 ? (
              <div className="bg-white rounded-3xl p-16 text-center border border-dark-200 shadow-sm max-w-md mx-auto my-12 space-y-4">
                <img
                  src="/images/camproo_app_icon.jpg"
                  alt="CampRoo Mascot"
                  className="w-16 h-16 rounded-2xl mx-auto object-cover shadow-sm border border-roo-200"
                />
                <h3 className="text-lg font-bold text-dark-900">No spots found</h3>
                <p className="text-xs text-dark-600 leading-relaxed font-normal">
                  Try widening your vehicle clearance, choosing another environment, or clearing active filters.
                </p>
                <button
                  onClick={resetFilters}
                  className="px-5 py-2.5 rounded-full bg-dark-900 text-white text-xs font-bold hover:bg-black transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-8"
              >
                {filteredSpots.map(spot => {
                  const host = users.find(u => u.id === spot.hostId);
                  return (
                    <SpotCard
                      key={spot.id}
                      spot={spot}
                      host={host}
                      isHovered={hoveredSpotId === spot.id}
                      onHover={setHoveredSpotId}
                      onSelect={handleSelectSpot}
                      onRequest={onRequestStay}
                    />
                  );
                })}
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Airbnb Signature Floating Bottom Center Pill ("Show map" / "Show list") with Liquid Glass */}
      <div className="fixed bottom-8 inset-x-0 flex justify-center z-40 pointer-events-none">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowMap(!showMap)}
          className="pointer-events-auto flex items-center gap-2 px-5 py-3 rounded-full liquid-glass-dark text-white text-xs font-bold shadow-float-pill transition-all"
        >
          {showMap ? (
            <>
              <span>Show list</span>
              <ListIcon className="w-4 h-4 text-roo-400" />
            </>
          ) : (
            <>
              <span>Show map</span>
              <MapIcon className="w-4 h-4 text-roo-400" />
            </>
          )}
        </motion.button>
      </div>

      {/* Filter Modal (Airbnb Style) */}
      <AnimatePresence>
        {showFiltersModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="bg-white rounded-3xl w-full max-w-lg overflow-hidden border border-dark-200 shadow-float max-h-[90vh] flex flex-col"
            >
              <div className="p-5 border-b border-dark-200 flex items-center justify-between">
                <button
                  onClick={() => setShowFiltersModal(false)}
                  className="p-1 rounded-full hover:bg-dark-100 text-dark-600"
                >
                  <X className="w-5 h-5" />
                </button>
                <h3 className="font-extrabold text-sm text-dark-900">Filters</h3>
                <button
                  onClick={resetFilters}
                  className="text-xs font-bold text-dark-600 underline hover:text-dark-900"
                >
                  Clear all
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                <FilterPanel />
              </div>

              <div className="p-4 border-t border-dark-200 flex items-center justify-between bg-dark-50">
                <button
                  onClick={resetFilters}
                  className="text-xs font-bold text-dark-700 underline"
                >
                  Clear all
                </button>
                <button
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
