import React, { useState, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Spot, User, isPublicSpot, getSpotAgencyInfo } from '../../types';
import {
  Star,
  ChevronLeft,
  ChevronRight,
  Heart,
  Truck,
  Zap,
  Droplet,
  Flame,
  ShieldCheck,
  Clock
} from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { useApp } from '../../context/AppContext';
import { getOptimizedImageUrl, getRawImageUrl, getAuthenticPhotos } from '../../lib/imageOptimizer';
import { SpotBiomeVisual } from '../common/SpotBiomeVisual';

export interface RoadTripStopInfo {
  stopIndex: number;
  arrivalTimeFormatted?: string;
  formattedDriveDuration?: string;
  distanceToRoute?: number;
}

interface SpotCardProps {
  spot: Spot & { distanceMiles?: number };
  host?: User;
  isHovered?: boolean;
  onHover?: (id: string | null) => void;
  onSelect: (id: string) => void;
  onRequest: (spot: Spot) => void;
  distanceMiles?: number;
  roadTripStop?: RoadTripStopInfo;
}

export const SpotCard: React.FC<SpotCardProps> = ({
  spot,
  host,
  isHovered = false,
  onHover,
  onSelect,
  onRequest,
  distanceMiles,
  roadTripStop,
}) => {
  const { isSpotSaved, toggleSaveSpot } = useApp();
  const [photoIdx, setPhotoIdx] = useState(0);
  const isSaved = isSpotSaved(spot.id);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [hasImageError, setHasImageError] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const isPublic = isPublicSpot(spot);
  const agencyInfo = getSpotAgencyInfo(spot);

  const authenticPhotos = useMemo(() => getAuthenticPhotos(spot.photos), [spot.photos]);
  const showBiomeVisual = authenticPhotos.length === 0 || hasImageError;

  const effectiveDistance = distanceMiles ?? spot.distanceMiles;

  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (authenticPhotos.length > 0) {
      setPhotoIdx((prev) => (prev + 1) % authenticPhotos.length);
    }
  };

  const prevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (authenticPhotos.length > 0) {
      setPhotoIdx((prev) => (prev - 1 + authenticPhotos.length) % authenticPhotos.length);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartXRef.current;
    if (Math.abs(diff) > 35 && authenticPhotos.length > 0) {
      if (diff < 0) {
        setPhotoIdx((prev) => (prev + 1) % authenticPhotos.length);
      } else {
        setPhotoIdx((prev) => (prev - 1 + authenticPhotos.length) % authenticPhotos.length);
      }
    }
    touchStartXRef.current = null;
  };

  const toggleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSaveSpot(spot.id);
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      onMouseEnter={() => onHover && onHover(spot.id)}
      onMouseLeave={() => onHover && onHover(null)}
      onClick={() => onSelect(spot.id)}
      className="h-full"
    >
      <Card className="group flex flex-col h-full cursor-pointer bg-card p-2.5 sm:p-3 border-border hover:border-primary/40 hover:shadow-airbnb-hover transition-all duration-300 rounded-2xl sm:rounded-3xl overflow-hidden">
        {/* Integrated Road Trip Stop Header */}
        {roadTripStop && (
          <div className="bg-gradient-to-r from-roo-500/10 via-amber-500/10 to-transparent border-b border-roo-200/80 -mx-2.5 -mt-2.5 sm:-mx-3 sm:-mt-3 mb-2 px-3 py-1.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="px-1.5 py-0.5 rounded-md bg-gradient-to-r from-roo-500 to-amber-500 text-white font-black text-[9px] shadow-2xs shrink-0">
                STOP #{roadTripStop.stopIndex}
              </span>
              {roadTripStop.arrivalTimeFormatted && (
                <span className="text-[11px] sm:text-xs font-black text-dark-950 flex items-center gap-1 truncate">
                  <Clock className="w-3 h-3 text-roo-500 shrink-0" />
                  <span>Arrive ~{roadTripStop.arrivalTimeFormatted}</span>
                </span>
              )}
            </div>
            <div className="text-[9px] sm:text-[10px] font-extrabold text-dark-600 shrink-0">
              {roadTripStop.formattedDriveDuration} {roadTripStop.distanceToRoute !== undefined ? `· ${(roadTripStop.distanceToRoute < 1 ? '< 1' : roadTripStop.distanceToRoute.toFixed(1))} mi off` : ''}
            </div>
          </div>
        )}

        {/* Visual Container: Authentic Photo Carousel OR Smart Biome Spec Card */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="relative aspect-[16/10] sm:aspect-[20/19] rounded-xl sm:rounded-2xl overflow-hidden bg-dark-200/50 mb-2 sm:mb-2.5 select-none"
        >
          {showBiomeVisual ? (
            <SpotBiomeVisual spot={spot} mode="card" />
          ) : (
            <>
              {/* Shimmer skeleton before image loads */}
              {!imgLoaded && (
                <div className="absolute inset-0 bg-gradient-to-r from-dark-200/40 via-dark-100/60 to-dark-200/40 animate-pulse z-0" />
              )}

              <img
                src={getOptimizedImageUrl(authenticPhotos[photoIdx] || authenticPhotos[0], { width: 560, quality: 75 })}
                alt={spot.title}
                loading="lazy"
                decoding="async"
                onLoad={() => setImgLoaded(true)}
                onError={() => setHasImageError(true)}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />

              {/* Carousel Arrows (Appear on Card Hover or Touch on Mobile) */}
              {authenticPhotos.length > 1 && (
                <div className="absolute inset-x-1.5 sm:inset-x-2 top-1/2 -translate-y-1/2 flex justify-between items-center opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  <button
                    onClick={prevPhoto}
                    className="pointer-events-auto p-1 sm:p-1.5 rounded-full bg-white/90 hover:bg-white text-dark-900 shadow-md hover:scale-110 active:scale-90 transition-transform cursor-pointer"
                  >
                    <ChevronLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </button>
                  <button
                    onClick={nextPhoto}
                    className="pointer-events-auto p-1 sm:p-1.5 rounded-full bg-white/90 hover:bg-white text-dark-900 shadow-md hover:scale-110 active:scale-90 transition-transform cursor-pointer"
                  >
                    <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </button>
                </div>
              )}

              {/* Carousel Dot Indicators */}
              {authenticPhotos.length > 1 && (
                <div className="absolute bottom-2 sm:bottom-2.5 inset-x-0 flex justify-center items-center gap-1 z-10 pointer-events-none">
                  {authenticPhotos.map((_, idx) => (
                    <span
                      key={idx}
                      className={`rounded-full transition-all ${
                        photoIdx === idx
                          ? 'w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white shadow-xs'
                          : 'w-1 sm:w-1.5 h-1 sm:h-1.5 bg-white/60'
                      }`}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Floating Heart Button with Liquid Glass */}
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={toggleSave}
            className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 p-1.5 sm:p-2 rounded-full liquid-glass-pill hover:bg-white transition-colors z-20"
          >
            <Heart
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${
                isSaved ? 'text-primary fill-primary' : 'text-foreground/80 hover:text-primary'
              }`}
            />
          </motion.button>

          {/* Distance from User Badge */}
          {effectiveDistance !== undefined && effectiveDistance < 800 && (
            <div className={`absolute ${showBiomeVisual ? 'bottom-2 left-2 sm:bottom-2.5 sm:left-2.5' : 'top-8 left-2 sm:top-9 sm:left-2.5'} z-20`}>
              <span className="text-[9px] sm:text-[10px] font-extrabold bg-blue-600/90 text-white px-1.5 sm:px-2 py-0.5 rounded-full shadow-xs backdrop-blur-xs flex items-center gap-1">
                {spot.mileMarker !== undefined ? (
                  <>🛣️ Mile {Math.round(spot.mileMarker)} · {effectiveDistance.toFixed(1)} mi off</>
                ) : (
                  <>📍 {effectiveDistance < 1 ? '< 1' : effectiveDistance.toFixed(1)} mi</>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Card Details - Streamlined for maximum visibility */}
        <div className="flex-1 flex flex-col justify-between space-y-1 sm:space-y-1.5 px-0.5 sm:px-1">
          {/* Row 1: Location Name and Star Rating */}
          <div className="flex items-start justify-between gap-1.5">
            <div className="min-w-0 flex-1">
              <h3 className="font-extrabold text-xs sm:text-sm text-foreground leading-snug line-clamp-1 group-hover:text-primary transition-colors">
                {spot.locationName}, {spot.generalArea}
              </h3>
              {spot.title &&
                spot.title.toLowerCase().trim() !== spot.locationName.toLowerCase().trim() && (
                  <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-1 font-medium mt-0.2">
                    {spot.title}
                  </p>
                )}
            </div>
            {spot.rating > 0 && spot.reviewCount > 0 && (
              <div className="flex items-center gap-1 text-[11px] sm:text-xs font-black text-foreground shrink-0 mt-0.5">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span>{spot.rating}</span>
              </div>
            )}
          </div>

          {/* Row 2: Rig Clearance, Access & Agency */}
          <div className="flex items-center justify-between gap-1.5 text-[10px] sm:text-xs text-muted-foreground font-medium pt-0.5">
            <div className="flex items-center gap-1.5 truncate">
              <Truck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary/70 shrink-0" />
              <span className="font-bold text-dark-800 dark:text-dark-200">Max {spot.rigCompatibility.maxLengthFt}ft</span>
              <span>·</span>
              <span className="capitalize truncate">{spot.rigCompatibility.accessType.replace('_', ' ')}</span>
            </div>

            {isPublic ? (
              <span className="text-[9px] sm:text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 sm:px-2 py-0.2 rounded-full border border-emerald-200/70 shrink-0">
                {agencyInfo.shortName}
              </span>
            ) : host ? (
              <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-muted-foreground font-medium shrink-0">
                <img src={host.avatar} alt="" className="w-3.5 h-3.5 rounded-full object-cover" />
                <span className="truncate max-w-[60px]">{host.name.split(' ')[0]}</span>
              </div>
            ) : null}
          </div>

          {/* Row 3: Clean Price & Navigation */}
          <div className="flex items-center justify-between pt-1.5 sm:pt-2 border-t border-border mt-0.5">
            <div className="flex items-baseline gap-1">
              <span className="font-black text-foreground text-xs sm:text-sm">$0</span>
              <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">
                {isPublic ? 'free stay' : 'community host'}
              </span>
            </div>

            <span className="text-[10px] sm:text-[11px] font-bold text-emerald-700 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform">
              View Specs →
            </span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
