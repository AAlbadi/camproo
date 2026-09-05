import React, { useState, useRef } from 'react';
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
import { getOptimizedImageUrl, getRawImageUrl, FALLBACK_CAMPING_PHOTO } from '../../lib/imageOptimizer';

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
  const touchStartXRef = useRef<number | null>(null);
  const isPublic = isPublicSpot(spot);
  const agencyInfo = getSpotAgencyInfo(spot);

  const effectiveDistance = distanceMiles ?? spot.distanceMiles;

  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoIdx((prev) => (prev + 1) % spot.photos.length);
  };

  const prevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoIdx((prev) => (prev - 1 + spot.photos.length) % spot.photos.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartXRef.current;
    if (Math.abs(diff) > 35) {
      if (diff < 0) {
        setPhotoIdx((prev) => (prev + 1) % spot.photos.length);
      } else {
        setPhotoIdx((prev) => (prev - 1 + spot.photos.length) % spot.photos.length);
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

        {/* Photo Container with Carousel & Heart Button - Compact aspect ratio on mobile */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="relative aspect-[16/10] sm:aspect-[20/19] rounded-xl sm:rounded-2xl overflow-hidden bg-dark-200/50 mb-2 sm:mb-2.5 select-none"
        >
          {/* Shimmer skeleton before image loads */}
          {!imgLoaded && (
            <div className="absolute inset-0 bg-gradient-to-r from-dark-200/40 via-dark-100/60 to-dark-200/40 animate-pulse z-0" />
          )}

          <img
            src={getOptimizedImageUrl(spot.photos[photoIdx] || spot.photos[0], { width: 560, quality: 75 })}
            alt={spot.title}
            loading="lazy"
            decoding="async"
            onLoad={() => setImgLoaded(true)}
            onError={(e) => {
              const target = e.currentTarget;
              const raw = getRawImageUrl(spot.photos[photoIdx] || spot.photos[0]);
              if (target.src !== raw && raw !== FALLBACK_CAMPING_PHOTO) {
                target.src = raw;
              } else {
                target.src = FALLBACK_CAMPING_PHOTO;
              }
              setImgLoaded(true);
            }}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />

          {/* Floating Heart Button with Liquid Glass */}
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={toggleSave}
            className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 p-1.5 sm:p-2 rounded-full liquid-glass-pill hover:bg-white transition-colors z-10"
          >
            <Heart
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${
                isSaved ? 'text-primary fill-primary' : 'text-foreground/80 hover:text-primary'
              }`}
            />
          </motion.button>

          {/* Badges: Free Stay + Distance from User */}
          <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 z-10 flex flex-col gap-1 items-start">
            <Badge variant="free" className="shadow-xs text-[9px] sm:text-[10px] px-1.5 py-0.2 sm:px-2 sm:py-0.5">
              FREE STAY
            </Badge>
            {effectiveDistance !== undefined && effectiveDistance < 800 && (
              <span className="text-[9px] sm:text-[10px] font-extrabold bg-blue-600/90 text-white px-1.5 sm:px-2 py-0.2 rounded-full shadow-xs backdrop-blur-xs flex items-center gap-1">
                {spot.mileMarker !== undefined ? (
                  <>🛣️ Mile {Math.round(spot.mileMarker)} · {effectiveDistance.toFixed(1)} mi off</>
                ) : (
                  <>📍 {effectiveDistance < 1 ? '< 1' : effectiveDistance.toFixed(1)} mi</>
                )}
              </span>
            )}
          </div>

          {/* Carousel Arrows (Appear on Card Hover or Touch on Mobile) */}
          {spot.photos.length > 1 && (
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
          {spot.photos.length > 1 && (
            <div className="absolute bottom-2 sm:bottom-2.5 inset-x-0 flex justify-center items-center gap-1 z-10 pointer-events-none">
              {spot.photos.map((_, idx) => (
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
            {spot.rating > 0 && spot.reviewCount > 0 ? (
              <div className="flex items-center gap-1 text-[11px] sm:text-xs font-black text-foreground shrink-0 mt-0.5">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span>{spot.rating}</span>
              </div>
            ) : isPublic ? (
              <span className="text-[9px] sm:text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.2 rounded border border-emerald-200/60 shrink-0 mt-0.5">
                Public Land
              </span>
            ) : (
              <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.2 rounded shrink-0 mt-0.5">
                Host Stay
              </span>
            )}
          </div>

          {/* Row 2: Rig Clearance, Access & Amenities */}
          <div className="flex items-center justify-between gap-1.5 text-[10px] sm:text-xs text-muted-foreground font-medium pt-0.5">
            <div className="flex items-center gap-1.5 truncate">
              <Truck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary/70 shrink-0" />
              <span className="font-bold text-dark-800 dark:text-dark-200">Max {spot.rigCompatibility.maxLengthFt}ft</span>
              <span>·</span>
              <span className="capitalize truncate">{spot.rigCompatibility.accessType.replace('_', ' ')}</span>
              {spot.amenities.electricity !== 'none' && (
                <>
                  <span>·</span>
                  <span className="text-amber-600 font-bold flex items-center gap-0.5 shrink-0">
                    <Zap className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                    <span>Elec</span>
                  </span>
                </>
              )}
              {spot.amenities.water !== 'none' && (
                <>
                  <span>·</span>
                  <span className="text-blue-600 font-bold flex items-center gap-0.5 shrink-0">
                    <Droplet className="w-2.5 h-2.5 fill-blue-500 text-blue-500" />
                    <span>Water</span>
                  </span>
                </>
              )}
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

          {/* Row 3: Price & Actions */}
          <div className="flex items-center justify-between pt-1.5 sm:pt-2 border-t border-border mt-0.5">
            <div className="flex items-baseline gap-1">
              <span className="font-black text-foreground text-xs sm:text-sm">$0</span>
              <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">
                {isPublic ? 'free public land' : 'free host stay'}
              </span>
            </div>

            <div className="flex items-center gap-1 sm:gap-1.5">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${spot.coordinates[0]},${spot.coordinates[1]}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-[10px] sm:text-[11px] font-extrabold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-0.5 px-1.5 py-0.5 rounded-md hover:bg-blue-50 transition-colors"
                title="Open GPS navigation in Google Maps"
              >
                <span>GPS ↗</span>
              </a>
              {isPublic ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(spot.id);
                  }}
                  className="rounded-full px-2.5 sm:px-3 h-6 sm:h-7 text-[10px] sm:text-xs font-bold border-emerald-300 text-emerald-800 bg-emerald-50/50 hover:bg-emerald-100 hover:text-emerald-900"
                >
                  Free Stay
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRequest(spot);
                  }}
                  className="rounded-full px-2.5 sm:px-3.5 h-6 sm:h-7 text-[10px] sm:text-xs font-bold"
                >
                  Request
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
