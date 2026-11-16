import React from 'react';
import { Spot, isPublicSpot, getSpotAgencyInfo } from '../../types';
import { SpotBiomeVisual } from '../common/SpotBiomeVisual';
import { useApp } from '../../context/AppContext';
import {
  Star,
  Truck,
  Zap,
  Droplet,
  Heart,
  ArrowRight,
  Clock,
  MapPin,
  ShieldCheck,
  Sun,
  Dog,
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { RoadTripStopInfo } from './SpotCard';

export interface SpotListRowProps {
  spot: Spot & { distanceMiles?: number };
  isSelected?: boolean;
  onSelect: (spot: Spot) => void;
  onNavigateDetails: (id: string) => void;
  onRequestStay: (spot: Spot) => void;
  roadTripStop?: RoadTripStopInfo;
  distanceMiles?: number;
}

export function formatSurfaceLabel(surface?: string): string {
  if (!surface) return 'Natural Ground';
  switch (surface) {
    case 'level_concrete':
      return 'Concrete Pad';
    case 'packed_gravel':
      return 'Packed Gravel';
    case 'firm_grass':
      return 'Firm Grass';
    case 'desert_hardpack':
      return 'Desert Hardpack';
    case 'dirt':
      return 'Dirt Track';
    default:
      return surface.replace('_', ' ');
  }
}

export const SpotListRow: React.FC<SpotListRowProps> = ({
  spot,
  isSelected = false,
  onSelect,
  onNavigateDetails,
  onRequestStay,
  roadTripStop,
  distanceMiles,
}) => {
  const { isSpotSaved, toggleSaveSpot } = useApp();
  const isSaved = isSpotSaved(spot.id);
  const agencyInfo = getSpotAgencyInfo(spot);
  const effectiveDistance = distanceMiles ?? spot.distanceMiles;

  const maxLength = spot.rigCompatibility?.maxLengthFt || 35;
  const surface = formatSurfaceLabel(spot.rigCompatibility?.surfaceType);
  const access = (spot.rigCompatibility?.accessType || 'back_in').replace('_', ' ');
  const isSolarIdeal = spot.amenities?.shade === 'open_sky';
  const hasElec = spot.amenities?.electricity && spot.amenities.electricity !== 'none';
  const hasWater = spot.amenities?.water && spot.amenities.water !== 'none';
  const petsOk = spot.amenities?.petsAllowed;

  return (
    <div
      onClick={() => onSelect(spot)}
      className={`p-3 sm:p-4 rounded-2xl sm:rounded-3xl border bg-white dark:bg-card transition-all duration-200 cursor-pointer flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 select-none ${
        isSelected
          ? 'border-roo-500 ring-2 ring-roo-500/20 bg-roo-50/15 shadow-md'
          : 'border-dark-200/80 hover:border-dark-300 hover:shadow-airbnb-hover'
      }`}
    >
      {/* Left: Biome Spec Emblem (Zero Photos - pure data & climate visualization) */}
      <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0">
        <SpotBiomeVisual spot={spot} mode="thumb" className="w-full h-full rounded-xl sm:rounded-2xl" />
      </div>

      {/* Middle: Details & Specs */}
      <div className="flex-1 min-w-0 w-full space-y-1.5">
        {/* Row 1: Agency, Location & Road Trip stop */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
            {roadTripStop ? (
              <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-roo-500 to-amber-500 text-white font-black text-[9px] shadow-2xs">
                STOP #{roadTripStop.stopIndex}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md bg-forest-50 text-forest-700 dark:bg-forest-950/40 dark:text-forest-300 border border-forest-200/60 uppercase text-[9px] font-black tracking-wider shrink-0">
                {agencyInfo.shortName}
              </span>
            )}
            <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground truncate">
              {spot.locationName}, {spot.generalArea}
            </span>
          </div>

          {/* Star rating on mobile/tablet */}
          <div className="flex sm:hidden items-center gap-1 text-[11px] font-black text-foreground shrink-0">
            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
            <span>{spot.rating || 4.8}</span>
          </div>
        </div>

        {/* Row 2: Haven Title */}
        <h4 className="text-sm sm:text-base font-black text-foreground truncate hover:text-primary transition-colors">
          {spot.title}
        </h4>

        {/* Row 3: Essential Rig & Land Spec Strip (NO PICTURES) */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[10px] sm:text-xs">
          {/* Rig Limit */}
          <span className="px-2 py-0.5 rounded-lg bg-dark-100 dark:bg-dark-800 text-foreground font-bold flex items-center gap-1">
            <Truck className="w-3 h-3 text-primary shrink-0" />
            <span>Max {maxLength}ft</span>
          </span>

          {/* Access Type */}
          <span className="px-2 py-0.5 rounded-lg bg-dark-100 dark:bg-dark-800 text-muted-foreground font-medium capitalize">
            {access}
          </span>

          {/* Surface */}
          <span className="px-2 py-0.5 rounded-lg bg-dark-100 dark:bg-dark-800 text-muted-foreground font-medium">
            {surface}
          </span>

          {/* Solar / Starlink Clearance */}
          {isSolarIdeal && (
            <span className="px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 font-bold flex items-center gap-1">
              <Sun className="w-2.5 h-2.5 text-amber-500" />
              <span>100% Solar Sky</span>
            </span>
          )}

          {/* Power */}
          {hasElec && (
            <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 font-bold flex items-center gap-0.5">
              <Zap className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
              <span>Elec</span>
            </span>
          )}

          {/* Water */}
          {hasWater && (
            <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-800 font-bold flex items-center gap-0.5">
              <Droplet className="w-2.5 h-2.5 fill-blue-500 text-blue-500" />
              <span>Water</span>
            </span>
          )}

          {/* Pets */}
          {petsOk && (
            <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 font-bold flex items-center gap-0.5">
              <Dog className="w-2.5 h-2.5 text-emerald-600" />
              <span>Pets OK</span>
            </span>
          )}

          {/* 100% Free Badge */}
          <Badge variant="free" className="text-[9px] px-1.5 py-0.2">
            FREE STAY
          </Badge>
        </div>
      </div>

      {/* Right: Distance, Rating & Actions */}
      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-dark-100 dark:border-dark-800 gap-2 sm:gap-2.5">
        {/* Rating & Distance */}
        <div className="flex items-center sm:flex-col sm:items-end gap-2 sm:gap-0.5">
          <div className="hidden sm:flex items-center gap-1 text-xs font-black text-foreground">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>{spot.rating || 4.8}</span>
            {spot.reviewCount > 0 && (
              <span className="text-[10px] text-muted-foreground font-medium">
                ({spot.reviewCount})
              </span>
            )}
          </div>

          {effectiveDistance !== undefined && effectiveDistance < 800 && (
            <span className="text-[10px] sm:text-[11px] font-extrabold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full border border-blue-200/50 flex items-center gap-1">
              <MapPin className="w-2.5 h-2.5 text-blue-600" />
              <span>{effectiveDistance < 1 ? '< 1' : effectiveDistance.toFixed(1)} mi</span>
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 ml-auto sm:ml-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => toggleSaveSpot(spot.id)}
            className="p-1.5 rounded-xl border border-dark-200 hover:bg-dark-100 dark:hover:bg-dark-800 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            title={isSaved ? 'Saved' : 'Save haven'}
          >
            <Heart
              className={`w-3.5 h-3.5 ${
                isSaved ? 'text-primary fill-primary' : 'text-muted-foreground'
              }`}
            />
          </button>

          <button
            onClick={() => onRequestStay(spot)}
            className="px-2.5 py-1 rounded-xl bg-roo-500 hover:bg-roo-600 text-white text-[11px] font-black shadow-2xs transition-all active:scale-95 cursor-pointer"
          >
            Request
          </button>

          <button
            onClick={() => onNavigateDetails(spot.id)}
            className="px-3 py-1 rounded-xl bg-dark-900 hover:bg-black text-white text-[11px] font-black shadow-2xs transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
          >
            <span>Details</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
