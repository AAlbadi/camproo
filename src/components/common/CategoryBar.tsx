import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { EnvironmentType } from '../../types';
import { Button, Badge } from '../ui';
import {
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Flame,
  Zap,
  Dog,
  Compass,
  Sun,
  Trees,
  Mountain,
  Palmtree,
  Grape,
  Tractor,
  Waves
} from 'lucide-react';

interface CategoryItem {
  id: string;
  label: string;
  icon: any;
  type: 'env' | 'amenity';
  val: any;
}

export const CATEGORIES: CategoryItem[] = [
  { id: 'all', label: 'All Spots', icon: Compass, type: 'env', val: null },
  { id: 'desert', label: 'Desert Oasis', icon: Palmtree, type: 'env', val: 'desert' },
  { id: 'farm', label: 'Farms & Ranches', icon: Tractor, type: 'env', val: 'farm' },
  { id: 'mountain', label: 'Mountain Vistas', icon: Mountain, type: 'env', val: 'mountain' },
  { id: 'forest', label: 'Pine Forests', icon: Trees, type: 'env', val: 'forest' },
  { id: 'coastal', label: 'Coastal Bluffs', icon: Waves, type: 'env', val: 'coastal' },
  { id: 'vineyard', label: 'Vineyards', icon: Grape, type: 'env', val: 'vineyard' },
  { id: 'electric-50', label: '50-Amp Electric', icon: Zap, type: 'amenity', val: '30amp' },
  { id: 'firepit', label: 'Campfire Nights', icon: Flame, type: 'amenity', val: 'firePit' },
  { id: 'pets', label: 'Pet Friendly', icon: Dog, type: 'amenity', val: 'pets' },
  { id: 'offgrid', label: 'Off-Grid & Solar', icon: Sun, type: 'amenity', val: 'offGrid' },
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
      const offset = direction === 'left' ? -240 : 240;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const isCategoryActive = (cat: CategoryItem) => {
    if (cat.id === 'all') {
      return searchFilters.environments.length === 0 && searchFilters.electricRequired === 'any' && !searchFilters.campfireAllowed;
    }
    if (cat.type === 'env') {
      return searchFilters.environments.includes(cat.val);
    }
    if (cat.id === 'electric-50') {
      return searchFilters.electricRequired === '30amp';
    }
    if (cat.id === 'firepit') {
      return searchFilters.campfireAllowed;
    }
    if (cat.id === 'pets') {
      return searchFilters.petsAllowed;
    }
    if (cat.id === 'offgrid') {
      return searchFilters.offGridOnly;
    }
    return false;
  };

  const handleSelectCategory = (cat: CategoryItem) => {
    if (cat.id === 'all') {
      setSearchFilters(prev => ({
        ...prev,
        environments: [],
        electricRequired: 'any',
        campfireAllowed: false,
        petsAllowed: false,
        offGridOnly: false,
      }));
      return;
    }

    if (cat.type === 'env') {
      setSearchFilters(prev => {
        const exists = prev.environments.includes(cat.val);
        return {
          ...prev,
          environments: exists ? prev.environments.filter(e => e !== cat.val) : [cat.val],
        };
      });
    } else if (cat.id === 'electric-50') {
      setSearchFilters(prev => ({
        ...prev,
        electricRequired: prev.electricRequired === '30amp' ? 'any' : '30amp',
      }));
    } else if (cat.id === 'firepit') {
      setSearchFilters(prev => ({ ...prev, campfireAllowed: !prev.campfireAllowed }));
    } else if (cat.id === 'pets') {
      setSearchFilters(prev => ({ ...prev, petsAllowed: !prev.petsAllowed }));
    } else if (cat.id === 'offgrid') {
      setSearchFilters(prev => ({ ...prev, offGridOnly: !prev.offGridOnly }));
    }
  };

  return (
    <div className="relative border-b border-dark-200 bg-white sticky top-20 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 py-3">
        {/* Left Scroll Arrow */}
        <button
          onClick={() => scroll('left')}
          className="hidden md:flex p-1.5 rounded-full border border-dark-300 hover:border-dark-800 hover:shadow-sm transition-all text-dark-700 hover:text-dark-900 shrink-0"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Scrollable Categories List */}
        <div
          ref={scrollContainerRef}
          className="flex items-center gap-7 sm:gap-8 overflow-x-auto scrollbar-none py-1 scroll-smooth"
        >
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const active = isCategoryActive(cat);
            return (
              <motion.button
                key={cat.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSelectCategory(cat)}
                className={`relative flex flex-col items-center gap-2 pb-2 text-center shrink-0 transition-colors group cursor-pointer ${
                  active ? 'text-dark-900 font-bold' : 'text-dark-600 hover:text-dark-900 font-medium'
                }`}
              >
                <Icon
                  className={`w-6 h-6 transition-transform duration-200 group-hover:scale-110 ${
                    active ? 'text-roo-500' : 'text-dark-600 group-hover:text-dark-900'
                  }`}
                />
                <span className="text-xs whitespace-nowrap tracking-tight">{cat.label}</span>
                {active && (
                  <motion.div
                    layoutId="category-underline"
                    className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-primary rounded-full"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Right Scroll Arrow */}
        <button
          onClick={() => scroll('right')}
          className="hidden md:flex p-1.5 rounded-full border border-border hover:border-foreground hover:shadow-xs transition-all text-muted-foreground hover:text-foreground shrink-0"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Filters Button with shadcn Button and Badge */}
        {onOpenFilters && (
          <Button
            variant="outline"
            size="default"
            onClick={onOpenFilters}
            className="rounded-2xl gap-2 font-bold text-xs shrink-0"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <Badge variant="default" className="w-5 h-5 p-0 justify-center text-[10px]">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};
