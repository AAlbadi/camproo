import React from 'react';
import { motion } from 'framer-motion';
import { Spot } from '../../types';
import { RouteResult, getGoogleMapsNavigationUrl } from '../../lib/routeService';
import { getOptimizedImageUrl } from '../../lib/imageOptimizer';
import {
  Navigation,
  Clock,
  ExternalLink,
  X,
  Loader2,
  Star,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export interface UberRouteDrawerProps {
  spot: Spot;
  originName?: string;
  originCoords: [number, number];
  route: RouteResult | null;
  isLoadingRoute: boolean;
  isSimulating?: boolean;
  onStartSimulation?: () => void;
  onStopSimulation?: () => void;
  onClearRoute: () => void;
  onRequestStay?: (spot: Spot) => void;
  onViewSpotDetails?: (spotId: string) => void;
  isRoadTripMode?: boolean;
  stopNumber?: number;
  totalStops?: number;
  formattedArrivalTime?: string;
  timeFromStartFormatted?: string;
  detourMiles?: number;
  mileMarker?: number;
}

export const UberRouteDrawer: React.FC<UberRouteDrawerProps> = ({
  spot,
  originCoords,
  route,
  isLoadingRoute,
  onClearRoute,
  onRequestStay,
  onViewSpotDetails,
  isRoadTripMode = false,
  stopNumber,
  totalStops,
  formattedArrivalTime,
  timeFromStartFormatted,
  detourMiles,
  mileMarker,
}) => {
  const googleMapsUrl = getGoogleMapsNavigationUrl(originCoords, spot.coordinates, spot.title);

  const fallbackDistance = React.useMemo(() => {
    const lat1 = originCoords[0];
    const lon1 = originCoords[1];
    const lat2 = spot.coordinates[0];
    const lon2 = spot.coordinates[1];
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    return Math.round(3958.8 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }, [originCoords, spot.coordinates]);

  const durationText = isRoadTripMode && formattedArrivalTime
    ? `Arrive ~${formattedArrivalTime} (${timeFromStartFormatted || 'direct'})`
    : route?.formattedDuration || (isLoadingRoute ? 'Calculating...' : `${Math.round(fallbackDistance / 50 * 60)} min`);

  const distanceText = isRoadTripMode && detourMiles !== undefined
    ? `${detourMiles} mi off highway${mileMarker !== undefined ? ` · Mile ${mileMarker}` : ''}`
    : route ? `${route.distanceMiles} mi` : `${fallbackDistance} mi`;

  const agencyName = (spot as any).landManager || (spot as any)._pipeline?.land_manager || spot.environment;

  // Format clean location without repeating spot title
  const cleanLocation = React.useMemo(() => {
    const titleClean = spot.title.trim().toLowerCase();
    const locClean = (spot.locationName || '').trim().toLowerCase();
    const agencyClean = locClean.replace(/^(usfs|blm|state park|nps|usda|coe)\s*/i, '').trim();
    if (locClean === titleClean || agencyClean === titleClean || !spot.locationName) {
      return spot.generalArea || 'Public Land';
    }
    return spot.locationName;
  }, [spot.title, spot.locationName, spot.generalArea]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 15, scale: 0.96 }}
      transition={{ type: 'spring', damping: 26, stiffness: 360 }}
      className="bg-white/95 backdrop-blur-2xl border border-dark-200/90 rounded-2xl sm:rounded-3xl shadow-[0_12px_36px_rgba(0,0,0,0.18)] p-2.5 sm:p-3 flex items-center gap-3 max-w-[580px] pointer-events-auto select-none"
    >
      {/* Photo Thumbnail (Clickable to open details) */}
      <div
        onClick={() => onViewSpotDetails?.(spot.id)}
        className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl overflow-hidden bg-dark-950 shrink-0 cursor-pointer shadow-xs group"
        title="Click to view listing details"
      >
        <img
          src={getOptimizedImageUrl(spot.photos[0], { width: 160, quality: 75 })}
          alt={spot.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            const target = e.currentTarget;
            if (!target.src.includes('real_bald_mountain')) {
              target.src = '/images/real_bald_mountain.jpg';
            }
          }}
        />
        <div className="absolute top-1 left-1 bg-dark-950/85 text-white px-1.5 py-0.5 rounded text-[8px] font-black leading-none">
          {isRoadTripMode && stopNumber ? `STOP #${stopNumber}` : '$0 FREE'}
        </div>
        <div className="absolute bottom-1 right-1 bg-roo-500 text-white px-1 py-0.5 rounded text-[8px] font-black leading-none">
          {spot.rigCompatibility?.maxLengthFt || 35}ft
        </div>
      </div>

      {/* Middle info */}
      <div className="flex-1 min-w-0 pr-1">
        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
          {isRoadTripMode && stopNumber && (
            <span className="px-1.5 py-0.2 rounded bg-roo-500 text-white uppercase text-[9px] font-black tracking-wider shadow-2xs">
              STOP #{stopNumber}{totalStops ? ` OF ${totalStops}` : ''}
            </span>
          )}
          <span className="px-1.5 py-0.2 rounded bg-forest-50 text-forest-700 uppercase text-[9px] font-black tracking-wider border border-forest-200/60">
            {agencyName}
          </span>
          <span className="text-[11px] font-bold text-dark-500 truncate max-w-[130px] sm:max-w-[180px]">
            {cleanLocation}
          </span>
          <div className="flex items-center gap-0.5 text-[10px] font-extrabold text-amber-600 ml-auto shrink-0">
            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
            <span>{spot.rating || 4.8}</span>
          </div>
        </div>

        <h4
          onClick={() => onViewSpotDetails?.(spot.id)}
          className="text-xs sm:text-sm font-black text-dark-950 truncate leading-snug cursor-pointer hover:text-roo-600 transition-colors"
          title={spot.title}
        >
          {spot.title}
        </h4>

        {/* Route duration and distance */}
        <div className="flex items-center gap-2 text-[11px] text-dark-600 font-bold mt-1 flex-wrap">
          <div className="flex items-center gap-1 text-dark-900">
            {isLoadingRoute ? (
              <Loader2 className="w-3 h-3 animate-spin text-roo-500" />
            ) : (
              <Clock className="w-3 h-3 text-roo-500 shrink-0" />
            )}
            <span className="font-extrabold">{durationText}</span>
          </div>
          <span className="text-dark-300">·</span>
          <div className="flex items-center gap-1 text-dark-700">
            <Navigation className="w-3 h-3 text-blue-600 shrink-0" />
            <span>{distanceText}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1.5 shrink-0">
        {onViewSpotDetails && (
          <button
            onClick={() => onViewSpotDetails(spot.id)}
            className="px-3 py-2 rounded-xl bg-dark-900 hover:bg-black text-white text-xs font-black shadow-xs active:scale-95 transition-all cursor-pointer flex items-center gap-1"
            title="Open listing details"
          >
            <span>View Details</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}

        {onRequestStay && (
          <button
            onClick={() => onRequestStay(spot)}
            className="hidden sm:flex px-3 py-2 rounded-xl bg-roo-500 hover:bg-roo-600 text-white text-xs font-black shadow-xs active:scale-95 transition-all cursor-pointer items-center gap-1"
            title="Request Stay"
          >
            <Sparkles className="w-3 h-3" />
            <span>Request</span>
          </button>
        )}

        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/70 transition-colors flex items-center justify-center cursor-pointer"
          title="Open GPS in Google Maps"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>

        <button
          onClick={onClearRoute}
          className="p-2 rounded-xl text-dark-400 hover:text-dark-900 hover:bg-dark-100 transition-colors cursor-pointer"
          title="Dismiss preview"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
};
