import React, { useState } from 'react';
import { Spot, getSpotAgencyInfo, EnvironmentType } from '../../types';
import { getAuthenticPhotos, getOptimizedImageUrl } from '../../lib/imageOptimizer';
import {
  TreePine,
  Mountain,
  Sun,
  Waves,
  Compass,
  Tent,
  Truck,
  Zap,
  Droplet,
  MapPin,
  Sparkles,
  Camera,
} from 'lucide-react';

export interface SpotThumbnailProps {
  spot: Spot;
  className?: string;
  badge?: React.ReactNode;
  showPhoto?: boolean;
}

export const SpotThumbnail: React.FC<SpotThumbnailProps> = ({
  spot,
  className = 'w-20 h-20 rounded-xl',
  badge,
  showPhoto = false,
}) => {
  const authenticPhotos = getAuthenticPhotos(spot.photos);
  const [hasError, setHasError] = useState(false);
  // In list views, we never show pictures; we always render the Smart Biome Spec Emblem
  const showBiome = !showPhoto || authenticPhotos.length === 0 || hasError;

  return (
    <div
      className={`relative overflow-hidden shrink-0 border border-dark-100/60 shadow-2xs select-none ${className}`}
    >
      {showBiome ? (
        <SpotBiomeVisual spot={spot} mode="thumb" />
      ) : (
        <img
          src={getOptimizedImageUrl(authenticPhotos[0], { width: 200, quality: 75 })}
          alt={spot.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          loading="lazy"
          onError={() => setHasError(true)}
        />
      )}
      {badge}
    </div>
  );
};

export interface SpotBiomeVisualProps {
  spot: Spot;
  mode?: 'card' | 'thumb' | 'banner';
  className?: string;
  onUploadPhotoClick?: (e: React.MouseEvent) => void;
}

interface BiomeTheme {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  accentColor: string;
  badgeBg: string;
  badgeText: string;
  contourStroke: string;
  vibeText: string;
}

export function getBiomeTheme(env: EnvironmentType | string | undefined): BiomeTheme {
  const normalized = (env || '').toLowerCase();

  switch (normalized) {
    case 'forest':
      return {
        label: 'PINE & FOREST CANOPY',
        icon: TreePine,
        gradient: 'from-[#061c14] via-[#0b291d] to-[#04100c]',
        accentColor: 'text-emerald-400',
        badgeBg: 'bg-emerald-950/80 border-emerald-500/30',
        badgeText: 'text-emerald-300',
        contourStroke: 'rgba(52, 211, 153, 0.18)',
        vibeText: 'Natural Pine Shade · Dispersed Haven',
      };
    case 'mountain':
      return {
        label: 'ALPINE MOUNTAIN RIDGE',
        icon: Mountain,
        gradient: 'from-[#0c1322] via-[#1a233a] to-[#080d18]',
        accentColor: 'text-sky-400',
        badgeBg: 'bg-sky-950/80 border-sky-500/30',
        badgeText: 'text-sky-300',
        contourStroke: 'rgba(56, 189, 248, 0.18)',
        vibeText: 'High Elevation · Scenic Vista',
      };
    case 'desert':
      return {
        label: 'OPEN DESERT MESA',
        icon: Sun,
        gradient: 'from-[#231109] via-[#381a0d] to-[#140803]',
        accentColor: 'text-amber-400',
        badgeBg: 'bg-amber-950/80 border-amber-500/30',
        badgeText: 'text-amber-300',
        contourStroke: 'rgba(251, 191, 36, 0.18)',
        vibeText: '100% Solar Sky · Starlink Ready',
      };
    case 'lakeside':
    case 'beach':
    case 'coastal':
      return {
        label: 'WATERFRONT & SHORELINE',
        icon: Waves,
        gradient: 'from-[#051923] via-[#0b2938] to-[#030e14]',
        accentColor: 'text-cyan-400',
        badgeBg: 'bg-cyan-950/80 border-cyan-500/30',
        badgeText: 'text-cyan-300',
        contourStroke: 'rgba(34, 211, 238, 0.18)',
        vibeText: 'Shoreline Breeze · Water Access',
      };
    case 'meadow':
    case 'farm':
    case 'vineyard':
    case 'rural':
      return {
        label: 'PRAIRIE & RURAL OASIS',
        icon: Tent,
        gradient: 'from-[#131f12] via-[#1f2f1a] to-[#0a1109]',
        accentColor: 'text-lime-400',
        badgeBg: 'bg-lime-950/80 border-lime-500/30',
        badgeText: 'text-lime-300',
        contourStroke: 'rgba(163, 230, 53, 0.18)',
        vibeText: 'Expansive Meadow · Peaceful Setting',
      };
    default:
      return {
        label: 'PUBLIC LAND EXPEDITION',
        icon: Compass,
        gradient: 'from-[#111827] via-[#1f2937] to-[#090d16]',
        accentColor: 'text-amber-400',
        badgeBg: 'bg-neutral-900/80 border-neutral-700/50',
        badgeText: 'text-amber-300',
        contourStroke: 'rgba(255, 255, 255, 0.12)',
        vibeText: 'Dispersed Public Haven · 100% Free',
      };
  }
}

function formatCoordinates(coords?: [number, number]): string {
  if (!coords || coords.length < 2) return '';
  const lat = coords[0];
  const lng = coords[1];
  const latStr = `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'}`;
  const lngStr = `${Math.abs(lng).toFixed(2)}°${lng >= 0 ? 'E' : 'W'}`;
  return `${latStr}, ${lngStr}`;
}

function formatSurface(surface?: string): string {
  if (!surface) return 'Natural Surface';
  switch (surface) {
    case 'level_concrete':
      return 'Concrete Pad';
    case 'packed_gravel':
      return 'Gravel Surface';
    case 'firm_grass':
      return 'Firm Grass';
    case 'desert_hardpack':
      return 'Desert Hardpack';
    case 'dirt':
      return 'Natural Dirt';
    default:
      return surface.replace('_', ' ');
  }
}

export const SpotBiomeVisual: React.FC<SpotBiomeVisualProps> = ({
  spot,
  mode = 'card',
  className = '',
  onUploadPhotoClick,
}) => {
  const theme = getBiomeTheme(spot.environment);
  const agencyInfo = getSpotAgencyInfo(spot);
  const coordsStr = formatCoordinates(spot.coordinates);
  const Icon = theme.icon;

  const maxLength = spot.rigCompatibility?.maxLengthFt || 35;
  const surface = formatSurface(spot.rigCompatibility?.surfaceType);
  const access = (spot.rigCompatibility?.accessType || 'back_in').replace('_', ' ');
  const shade = spot.amenities?.shade;
  const isSolarIdeal = shade === 'open_sky';
  const hasElec = spot.amenities?.electricity && spot.amenities.electricity !== 'none';
  const hasWater = spot.amenities?.water && spot.amenities.water !== 'none';

  // 1. MINI THUMBNAIL MODE (e.g. for sidebar rows, mobile sheet pills: 56x56, 80x80)
  if (mode === 'thumb') {
    return (
      <div
        className={`relative w-full h-full rounded-xl overflow-hidden bg-gradient-to-br ${theme.gradient} flex flex-col items-center justify-between p-1.5 select-none text-white border border-white/10 ${className}`}
      >
        {/* Subtle contour map overlay */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none opacity-25"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
        >
          <path d="M-10,30 Q25,10 50,40 T110,20" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M-10,65 Q30,45 60,75 T110,60" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M-10,90 Q40,80 75,95 T110,85" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>

        {/* Agency Badge top left */}
        <div className="w-full flex items-center justify-between text-[8px] font-black z-10 leading-none">
          <span className="bg-black/60 px-1 py-0.5 rounded text-[7.5px] uppercase tracking-wider text-white/90">
            {agencyInfo.shortName}
          </span>
          <span className="text-[7.5px] font-mono text-white/60">
            {spot.coordinates?.[0] ? `${Math.round(spot.coordinates[0])}°` : ''}
          </span>
        </div>

        {/* Center Icon */}
        <div className="flex flex-col items-center justify-center my-auto z-10">
          <div className="w-7 h-7 rounded-lg bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/10 shadow-xs">
            <Icon className={`w-4 h-4 ${theme.accentColor}`} />
          </div>
        </div>

        {/* Rig limit bottom */}
        <div className="w-full flex items-center justify-between text-[8px] font-bold z-10 leading-none pt-0.5 border-t border-white/10">
          <span className="text-white/80 font-black">{maxLength}ft</span>
          <span className="text-[7px] text-amber-300 font-extrabold">FREE</span>
        </div>
      </div>
    );
  }

  // 2. HERO BANNER MODE (For SpotDetailPage when spot has 0 authentic photos)
  if (mode === 'banner') {
    return (
      <div
        className={`relative w-full rounded-3xl overflow-hidden bg-gradient-to-br ${theme.gradient} p-6 sm:p-8 text-white border border-white/15 shadow-lg select-none ${className}`}
      >
        {/* Rich Topographic Vector Map Background */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
          preserveAspectRatio="none"
          viewBox="0 0 800 400"
        >
          <path d="M-50,80 Q200,20 400,120 T850,70" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M-50,160 Q250,90 500,200 T850,140" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M-50,240 Q180,180 420,300 T850,220" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M-50,320 Q300,260 600,360 T850,300" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="580" cy="180" r="160" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 6" opacity="0.4" />
        </svg>

        <div className="relative z-10 flex flex-col justify-between h-full min-h-[260px] gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-black/60 border border-white/20 text-xs font-black uppercase tracking-wider text-white">
                🏛️ {agencyInfo.agency}
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-black">
                100% FREE STAY
              </span>
            </div>

            {coordsStr && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-mono text-white/90">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>{coordsStr}</span>
              </div>
            )}
          </div>

          <div className="max-w-2xl">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
                <Icon className={`w-5 h-5 ${theme.accentColor}`} />
              </div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-white/70">
                {theme.label}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              {spot.title}
            </h2>
            <p className="text-sm text-white/80 font-medium mt-1">
              {theme.vibeText} · Verified Public Land GPS Haven
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/15">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-3 py-1 rounded-xl bg-white/10 backdrop-blur-xs font-bold border border-white/10 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-primary" />
                <span>Max {maxLength}ft Rig</span>
              </span>
              <span className="px-3 py-1 rounded-xl bg-white/10 backdrop-blur-xs font-bold border border-white/10">
                {surface}
              </span>
              <span className="px-3 py-1 rounded-xl bg-white/10 backdrop-blur-xs font-bold border border-white/10 capitalize">
                {access}
              </span>
              {isSolarIdeal && (
                <span className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  ☀️ Open Sky (Starlink Ready)
                </span>
              )}
            </div>

            {onUploadPhotoClick && (
              <button
                onClick={onUploadPhotoClick}
                className="px-4 py-2 rounded-xl bg-white text-dark-950 hover:bg-neutral-100 font-black text-xs transition-all flex items-center gap-2 shadow-md cursor-pointer active:scale-95"
              >
                <Camera className="w-3.5 h-3.5 text-roo-500" />
                <span>Add First Photo</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 3. MAIN CARD MODE (Standard SpotCard visual container: aspect-[16/10] sm:aspect-[20/19])
  return (
    <div
      className={`relative w-full h-full rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-br ${theme.gradient} flex flex-col justify-between p-3 sm:p-3.5 text-white select-none border border-white/10 shadow-inner ${className}`}
    >
      {/* Topographic Elevation Contour Lines Background */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        preserveAspectRatio="none"
        viewBox="0 0 400 300"
      >
        <path
          d="M-20,60 Q120,20 220,80 T420,50"
          fill="none"
          stroke={theme.contourStroke}
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="M-20,120 Q140,80 260,150 T420,110"
          fill="none"
          stroke={theme.contourStroke}
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="M-20,180 Q100,150 240,230 T420,170"
          fill="none"
          stroke={theme.contourStroke}
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="M-20,240 Q160,210 300,280 T420,230"
          fill="none"
          stroke={theme.contourStroke}
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
        <ellipse
          cx="300"
          cy="120"
          rx="90"
          ry="60"
          fill="none"
          stroke={theme.contourStroke}
          strokeWidth="1"
          strokeDasharray="3 5"
          opacity="0.6"
        />
      </svg>

      {/* Top Row: Agency Pill + Coordinates Stamp */}
      <div className="relative z-10 flex items-center justify-between gap-1.5 pt-0.5">
        <div className="flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded-md bg-black/60 border border-white/15 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-white backdrop-blur-xs">
            {agencyInfo.shortName}
          </span>
          <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/25 border border-emerald-400/30 text-[9px] sm:text-[10px] font-black text-emerald-300">
            FREE
          </span>
        </div>

        {coordsStr && (
          <span className="text-[9px] sm:text-[10px] font-mono text-white/70 bg-white/10 backdrop-blur-xs px-2 py-0.5 rounded-full border border-white/10">
            {coordsStr}
          </span>
        )}
      </div>

      {/* Centerpiece: Distinct Biome Emblem & Vibe */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center my-auto py-1">
        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mb-1.5 shadow-lg group-hover:scale-110 transition-transform duration-300">
          <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${theme.accentColor}`} />
        </div>
        <span className="text-[10px] sm:text-[11px] font-black tracking-wider uppercase text-white/90">
          {theme.label}
        </span>
        <span className="text-[9px] sm:text-[10px] font-semibold text-white/70 max-w-[200px] line-clamp-1">
          {theme.vibeText}
        </span>
      </div>

      {/* Bottom Spec Pills: Rig clearance, road type & solar suitability */}
      <div className="relative z-10 w-full pt-2 border-t border-white/15">
        <div className="grid grid-cols-2 gap-1.5 text-[9px] sm:text-[10px]">
          {/* Rig Limit */}
          <div className="flex items-center gap-1 bg-black/40 backdrop-blur-xs rounded-lg px-2 py-1 border border-white/10">
            <Truck className="w-3 h-3 text-primary shrink-0" />
            <span className="font-extrabold text-white truncate">Max {maxLength}ft Rig</span>
          </div>

          {/* Surface & Access */}
          <div className="flex items-center gap-1 bg-black/40 backdrop-blur-xs rounded-lg px-2 py-1 border border-white/10">
            <span className="text-white/60">🛣️</span>
            <span className="font-medium text-white/90 truncate">{surface}</span>
          </div>
        </div>

        {/* Feature Chip (Solar, Power, or Water) */}
        <div className="mt-1 flex items-center justify-between text-[8px] sm:text-[9px] text-white/75 font-semibold px-0.5">
          <span className="truncate">
            {isSolarIdeal
              ? '☀️ 100% Solar Sky · Starlink Ready'
              : hasElec
              ? '⚡ Electric Hookup Available'
              : hasWater
              ? '💧 Water Access Available'
              : '🌲 Dispersed Wild Camping'}
          </span>
          <span className="capitalize text-white/60 text-[8px] font-medium shrink-0 ml-1">
            {access}
          </span>
        </div>
      </div>
    </div>
  );
};
