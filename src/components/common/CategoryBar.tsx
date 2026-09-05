import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { Button, Badge } from '../ui';
import {
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Flame,
  Droplet,
  Compass,
  Sun,
  Trees,
  Mountain,
  Palmtree,
  Waves,
  Home,
  Trash2,
  ShieldCheck,
  Star
} from 'lucide-react';

export interface CategoryItem {
  id: string;
  label: string;
  countLabel: string;
  icon: any;
  type: 'all' | 'env' | 'agency' | 'amenity' | 'featured';
  val: any;
}

export const CATEGORIES: CategoryItem[] = [
  { id: 'all', label: 'All Havens', countLabel: '9,780', icon: Compass, type: 'all', val: null },
  { id: 'usfs', label: 'USFS Forests', countLabel: '9,313', icon: ShieldCheck, type: 'agency', val: 'USFS' },
  { id: 'blm', label: 'BLM Public Lands', countLabel: '464', icon: Mountain, type: 'agency', val: 'BLM' },
  { id: 'lakeside', label: 'Lakes & Rivers', countLabel: '3,861', icon: Waves, type: 'env', val: 'lakeside' },
  { id: 'forest', label: 'Pine Forests', countLabel: '4,939', icon: Trees, type: 'env', val: 'forest' },
  { id: 'mountain', label: 'Mountain Vistas', countLabel: '445', icon: Mountain, type: 'env', val: 'mountain' },
  { id: 'desert', label: 'Desert Oasis', countLabel: '383', icon: Palmtree, type: 'env', val: 'desert' },
  { id: 'beach', label: 'Coastal & Beach', countLabel: '86', icon: Sun, type: 'env', val: 'beach' },
  { id: 'restroom', label: 'Vault Toilets', countLabel: '354', icon: Home, type: 'amenity', val: 'bathroomRequired' },
  { id: 'water', label: 'Potable Water', countLabel: '329', icon: Droplet, type: 'amenity', val: 'waterRequired' },
  { id: 'firepit', label: 'Campfire Rings', countLabel: '278', icon: Flame, type: 'amenity', val: 'firePitRequired' },
  { id: 'featured', label: 'Featured Gems', countLabel: '185', icon: Star, type: 'featured', val: true },
];

interface CategoryBarProps {
  onOpenFilters?: () => void;
  activeFilterCount?: number;
}

export const CategoryBar: React.FC<CategoryBarProps> = ({ onOpenFilters, activeFilterCount = 0 }) => {
  const { searchFilters, setSearchFilters } = useApp();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const offset = direction === 'left' ? -260 : 260;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const isCategoryActive = (cat: CategoryItem) => {
    if (cat.id === 'all') {
      return (
        searchFilters.environments.length === 0 &&
        (!searchFilters.landManager || searchFilters.landManager === 'all') &&
        !searchFilters.bathroomRequired &&
        !searchFilters.waterRequired &&
        !searchFilters.firePitRequired &&
        !searchFilters.trashRequired &&
        !searchFilters.featuredOnly
      );
    }
    if (cat.type === 'env') {
      return searchFilters.environments.includes(cat.val);
    }
    if (cat.type === 'agency') {
      return searchFilters.landManager === cat.val;
    }
    if (cat.type === 'amenity') {
      return Boolean((searchFilters as any)[cat.val]);
    }
    if (cat.type === 'featured') {
      return Boolean(searchFilters.featuredOnly);
    }
    return false;
  };

  const handleSelectCategory = (cat: CategoryItem) => {
    if (cat.id === 'all') {
      setSearchFilters((prev) => ({
        ...prev,
        environments: [],
        landManager: 'all',
        bathroomRequired: false,
        waterRequired: false,
        firePitRequired: false,
        trashRequired: false,
        featuredOnly: false,
      }));
      return;
    }

    if (cat.type === 'env') {
      setSearchFilters((prev) => {
        const exists = prev.environments.includes(cat.val);
        return {
          ...prev,
          environments: exists ? prev.environments.filter((e) => e !== cat.val) : [cat.val],
        };
      });
    } else if (cat.type === 'agency') {
      setSearchFilters((prev) => ({
        ...prev,
        landManager: prev.landManager === cat.val ? 'all' : cat.val,
      }));
    } else if (cat.type === 'amenity') {
      setSearchFilters((prev) => ({
        ...prev,
        [cat.val]: !(prev as any)[cat.val],
      }));
    } else if (cat.type === 'featured') {
      setSearchFilters((prev) => ({
        ...prev,
        featuredOnly: !prev.featuredOnly,
      }));
    }
  };

  return (
    <div className="relative border-b border-dark-100/80 bg-white/90 backdrop-blur-md sticky top-16 z-30 shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2 py-1.5">
        {/* Left Scroll Arrow */}
        <button
          onClick={() => scroll('left')}
          className="hidden md:flex p-1 rounded-full border border-dark-200/80 hover:border-dark-800 hover:shadow-xs transition-all text-dark-600 hover:text-dark-950 bg-white shrink-0"
          aria-label="Scroll categories left"
        >
          <ChevronLeft className="w-3 h-3" />
        </button>

        {/* Scrollable Categories List */}
        <div
          ref={scrollContainerRef}
          className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none py-0.5 scroll-smooth"
        >
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const active = isCategoryActive(cat);
            return (
              <button
                key={cat.id}
                onClick={() => handleSelectCategory(cat)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer select-none border ${
                  active
                    ? 'bg-dark-950 text-white border-dark-950 shadow-xs'
                    : 'bg-white/80 hover:bg-white text-dark-700 hover:text-dark-950 border-dark-200/80 hover:border-dark-400'
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 shrink-0 ${
                    active ? 'text-roo-400' : 'text-dark-500'
                  }`}
                />
                <span className="whitespace-nowrap tracking-tight">{cat.label}</span>
                <span
                  className={`text-[10px] px-1 py-0.2 rounded-full font-medium ${
                    active ? 'bg-white/20 text-white' : 'text-dark-400'
                  }`}
                >
                  {cat.countLabel}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Scroll Arrow */}
        <button
          onClick={() => scroll('right')}
          className="hidden md:flex p-1 rounded-full border border-dark-200/80 hover:border-dark-800 hover:shadow-xs transition-all text-dark-600 hover:text-dark-950 bg-white shrink-0"
          aria-label="Scroll categories right"
        >
          <ChevronRight className="w-3 h-3" />
        </button>

        {/* Filters Button */}
        {onOpenFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenFilters}
            className="liquid-glass-pill rounded-full gap-1.5 font-bold text-xs shrink-0 border-white/80 hover:border-dark-400 text-dark-900 h-8 px-3 shadow-2xs"
          >
            <SlidersHorizontal className="w-3 h-3 text-roo-500" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <Badge variant="default" className="w-4 h-4 p-0 justify-center text-[9px] bg-roo-500 text-white">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};
