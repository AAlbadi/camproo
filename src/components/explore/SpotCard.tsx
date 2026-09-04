import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Spot, User } from '../../types';
import {
  Star,
  ChevronLeft,
  ChevronRight,
  Heart,
  Truck,
  Zap,
  Droplet,
  Flame,
  ShieldCheck
} from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface SpotCardProps {
  spot: Spot;
  host?: User;
  isHovered?: boolean;
  onHover?: (id: string | null) => void;
  onSelect: (id: string) => void;
  onRequest: (spot: Spot) => void;
}

export const SpotCard: React.FC<SpotCardProps> = ({
  spot,
  host,
  isHovered = false,
  onHover,
  onSelect,
  onRequest,
}) => {
  const [photoIdx, setPhotoIdx] = useState(0);
  const [isSaved, setIsSaved] = useState(false);

  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoIdx((prev) => (prev + 1) % spot.photos.length);
  };

  const prevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoIdx((prev) => (prev - 1 + spot.photos.length) % spot.photos.length);
  };

  const toggleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSaved(!isSaved);
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
      <Card className="group flex flex-col h-full cursor-pointer bg-card p-3 border-border hover:border-primary/40 hover:shadow-airbnb-hover transition-all duration-300">
        {/* Photo Container with Carousel & Heart Button */}
        <div className="relative aspect-[20/19] rounded-2xl overflow-hidden bg-muted mb-3 select-none">
          <img
            src={spot.photos[photoIdx] || spot.photos[0]}
            alt={spot.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />

          {/* Floating Heart Button with Liquid Glass */}
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={toggleSave}
            className="absolute top-3 right-3 p-2 rounded-full liquid-glass-pill hover:bg-white transition-colors z-10"
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                isSaved ? 'text-primary fill-primary' : 'text-foreground/80 hover:text-primary'
              }`}
            />
          </motion.button>

          {/* Free Badge with shadcn Badge */}
          <div className="absolute top-3 left-3 z-10">
            <Badge variant="free" className="shadow-xs text-[10px]">
              FREE STAY
            </Badge>
          </div>

          {/* Carousel Arrows (Appear on Card Hover) */}
          {spot.photos.length > 1 && (
            <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <button
                onClick={prevPhoto}
                className="pointer-events-auto p-1.5 rounded-full bg-white/90 hover:bg-white text-dark-900 shadow-md hover:scale-110 transition-transform"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={nextPhoto}
                className="pointer-events-auto p-1.5 rounded-full bg-white/90 hover:bg-white text-dark-900 shadow-md hover:scale-110 transition-transform"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Carousel Dot Indicators */}
          {spot.photos.length > 1 && (
            <div className="absolute bottom-2.5 inset-x-0 flex justify-center items-center gap-1 z-10 pointer-events-none">
              {spot.photos.map((_, idx) => (
                <span
                  key={idx}
                  className={`rounded-full transition-all ${
                    photoIdx === idx
                      ? 'w-2 h-2 bg-white shadow-xs'
                      : 'w-1.5 h-1.5 bg-white/60'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Card Details */}
        <div className="flex-1 flex flex-col justify-between space-y-1 px-1">
          {/* Row 1: Title and Star Rating */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-extrabold text-sm text-foreground leading-snug line-clamp-1 group-hover:text-primary transition-colors">
              {spot.locationName}, {spot.generalArea}
            </h3>
            <div className="flex items-center gap-1 text-xs font-black text-foreground shrink-0">
              <Star className="w-3 h-3 text-primary fill-primary" />
              <span>{spot.rating}</span>
            </div>
          </div>

          {/* Row 2: Spot Name */}
          <p className="text-xs text-muted-foreground line-clamp-1 font-normal">
            {spot.title}
          </p>

          {/* Row 3: Rig Clearance & Access */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium pt-0.5">
            <Truck className="w-3.5 h-3.5 text-primary/70 shrink-0" />
            <span>Up to {spot.rigCompatibility.maxLengthFt} ft</span>
            <span>·</span>
            <span className="capitalize">{spot.rigCompatibility.accessType.replace('_', ' ')}</span>
          </div>

          {/* Row 4: Hookup Pills & Host Preview */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2 text-[11px] font-semibold">
              {spot.amenities.electricity !== 'none' && (
                <span className="flex items-center gap-0.5 text-amber-700 dark:text-amber-400">
                  <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span>{spot.amenities.electricity.toUpperCase()}</span>
                </span>
              )}
              {spot.amenities.water !== 'none' && (
                <span className="flex items-center gap-0.5 text-blue-700 dark:text-blue-400">
                  <Droplet className="w-3 h-3 text-blue-500 fill-blue-500" />
                  <span>Water</span>
                </span>
              )}
              {spot.amenities.firePit && (
                <span className="flex items-center gap-0.5 text-orange-700 dark:text-orange-400">
                  <Flame className="w-3 h-3 text-orange-500 fill-orange-500" />
                  <span>Campfire</span>
                </span>
              )}
            </div>

            {host && (
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                <img src={host.avatar} alt="" className="w-4 h-4 rounded-full object-cover" />
                <span className="truncate max-w-[65px]">{host.name.split(' ')[0]}</span>
              </div>
            )}
          </div>

          {/* Row 5: Price & Request Action */}
          <div className="flex items-center justify-between pt-2 border-t border-border mt-1">
            <div className="flex items-baseline gap-1">
              <span className="font-black text-foreground text-sm">$0</span>
              <span className="text-xs text-muted-foreground font-medium">total · free stay</span>
            </div>

            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onRequest(spot);
              }}
              className="rounded-full px-3.5 h-7 text-xs font-bold"
            >
              Request
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
