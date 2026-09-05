import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { US_STATES, countSpotsByState } from '../../lib/areaSearchService';
import {
  SlidersHorizontal,
  RotateCcw,
  Trees,
  Mountain,
  Droplet,
  Flame,
  Trash2,
  Home,
  Compass,
  Sparkles,
  MapPin,
  Waves,
  Sun,
  ShieldCheck
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';

interface FilterPanelProps {
  className?: string;
  onClose?: () => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({ className = '', onClose }) => {
  const { spots, searchFilters, setSearchFilters, resetFilters } = useApp();

  const stateCounts = useMemo(() => countSpotsByState(spots), [spots]);

  // Real environments from dataset
  const environments = [
    { key: 'forest', label: 'Forest', icon: '🌲', count: 4939 },
    { key: 'lakeside', label: 'Lakeside & River', icon: '🏞️', count: 3861 },
    { key: 'mountain', label: 'Mountain Vistas', icon: '⛰️', count: 445 },
    { key: 'desert', label: 'Desert Oasis', icon: '🏜️', count: 383 },
    { key: 'beach', label: 'Beach & Coastal', icon: '🏖️', count: 86 },
    { key: 'meadow', label: 'Open Meadow', icon: '🌼', count: 63 },
  ];

  const toggleEnvironment = (envKey: string) => {
    setSearchFilters((prev) => {
      const exists = prev.environments.includes(envKey);
      return {
        ...prev,
        environments: exists
          ? prev.environments.filter((e) => e !== envKey)
          : [...prev.environments, envKey],
      };
    });
  };

  // Top states by count for quick selection
  const topStates = useMemo(() => {
    return Object.entries(stateCounts)
      .sort((a, b) => b[1] - a[1])
      .filter(([abbr]) => US_STATES[abbr]);
  }, [stateCounts]);

  return (
    <aside className={`bg-card rounded-3xl p-5 border border-border shadow-sm space-y-5 select-none ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-primary" />
          <h3 className="font-black text-sm text-foreground">Useful Camp Filters</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={resetFilters}
          className="text-xs font-bold text-primary hover:text-primary/80 h-7 px-2"
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Reset All
        </Button>
      </div>

      {/* Free badge indicator */}
      <div className="p-3 rounded-2xl bg-secondary/80 border border-border flex items-center justify-between text-xs">
        <span className="font-bold text-foreground flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          $0 Free Dispersed Camping
        </span>
        <Badge variant="free">
          100% FREE
        </Badge>
      </div>

      <Separator />

      {/* 1. Public Land Agency Filter (USFS vs BLM) */}
      <div className="space-y-2.5">
        <label className="text-[11px] font-black text-muted-foreground block uppercase tracking-wider">
          Public Land Agency
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setSearchFilters((prev) => ({ ...prev, landManager: 'all' }))}
            className={`px-3 py-2 rounded-2xl text-xs font-black transition-all flex flex-col items-center gap-1 border ${
              searchFilters.landManager === 'all'
                ? 'bg-dark-900 text-white border-dark-900 shadow-xs'
                : 'bg-muted/60 text-foreground border-transparent hover:bg-muted'
            }`}
          >
            <Compass className="w-4 h-4 text-roo-400" />
            <span>All Agencies</span>
          </button>

          <button
            type="button"
            onClick={() => setSearchFilters((prev) => ({ ...prev, landManager: 'USFS' }))}
            className={`px-3 py-2 rounded-2xl text-xs font-black transition-all flex flex-col items-center gap-1 border ${
              searchFilters.landManager === 'USFS'
                ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                : 'bg-emerald-50/70 text-emerald-950 border-emerald-200/60 hover:bg-emerald-100'
            }`}
          >
            <Trees className="w-4 h-4 text-emerald-600" />
            <span>USFS Forest</span>
            <span className="text-[9px] font-bold opacity-80">9,313 spots</span>
          </button>

          <button
            type="button"
            onClick={() => setSearchFilters((prev) => ({ ...prev, landManager: 'BLM' }))}
            className={`px-3 py-2 rounded-2xl text-xs font-black transition-all flex flex-col items-center gap-1 border ${
              searchFilters.landManager === 'BLM'
                ? 'bg-amber-700 text-white border-amber-800 shadow-xs'
                : 'bg-amber-50/70 text-amber-950 border-amber-200/60 hover:bg-amber-100'
            }`}
          >
            <Mountain className="w-4 h-4 text-amber-600" />
            <span>BLM Public</span>
            <span className="text-[9px] font-bold opacity-80">464 spots</span>
          </button>
        </div>
      </div>

      <Separator />

      {/* 2. Verified Real Amenities */}
      <div className="space-y-2.5">
        <label className="text-[11px] font-black text-muted-foreground block uppercase tracking-wider">
          Verified Camp Amenities (In Dataset)
        </label>
        <div className="space-y-2 text-xs">
          <label className="flex items-center justify-between p-2 rounded-xl hover:bg-muted/50 cursor-pointer group transition-colors">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={searchFilters.bathroomRequired}
                onChange={(e) => setSearchFilters((prev) => ({ ...prev, bathroomRequired: e.target.checked }))}
                className="rounded-md accent-primary w-4 h-4 cursor-pointer"
              />
              <span className="text-foreground group-hover:text-primary font-semibold flex items-center gap-1.5 transition-colors">
                <Home className="w-3.5 h-3.5 text-blue-600" />
                Restroom / Vault Toilet
              </span>
            </div>
            <span className="text-[10px] font-black text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              354 spots
            </span>
          </label>

          <label className="flex items-center justify-between p-2 rounded-xl hover:bg-muted/50 cursor-pointer group transition-colors">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={searchFilters.waterRequired}
                onChange={(e) => setSearchFilters((prev) => ({ ...prev, waterRequired: e.target.checked }))}
                className="rounded-md accent-primary w-4 h-4 cursor-pointer"
              />
              <span className="text-foreground group-hover:text-primary font-semibold flex items-center gap-1.5 transition-colors">
                <Droplet className="w-3.5 h-3.5 text-blue-500 fill-blue-500" />
                Potable Drinking Water Spigot
              </span>
            </div>
            <span className="text-[10px] font-black text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              329 spots
            </span>
          </label>

          <label className="flex items-center justify-between p-2 rounded-xl hover:bg-muted/50 cursor-pointer group transition-colors">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={searchFilters.firePitRequired}
                onChange={(e) => setSearchFilters((prev) => ({ ...prev, firePitRequired: e.target.checked }))}
                className="rounded-md accent-primary w-4 h-4 cursor-pointer"
              />
              <span className="text-foreground group-hover:text-primary font-semibold flex items-center gap-1.5 transition-colors">
                <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                Campfire Pit / Metal Ring
              </span>
            </div>
            <span className="text-[10px] font-black text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              278 spots
            </span>
          </label>

          <label className="flex items-center justify-between p-2 rounded-xl hover:bg-muted/50 cursor-pointer group transition-colors">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={searchFilters.trashRequired}
                onChange={(e) => setSearchFilters((prev) => ({ ...prev, trashRequired: e.target.checked }))}
                className="rounded-md accent-primary w-4 h-4 cursor-pointer"
              />
              <span className="text-foreground group-hover:text-primary font-semibold flex items-center gap-1.5 transition-colors">
                <Trash2 className="w-3.5 h-3.5 text-emerald-600" />
                Trash Disposal on Site
              </span>
            </div>
            <span className="text-[10px] font-black text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              163 spots
            </span>
          </label>
        </div>
      </div>

      <Separator />

      {/* 3. Landscape & Setting */}
      <div className="space-y-2.5">
        <label className="text-[11px] font-black text-muted-foreground block uppercase tracking-wider">
          Landscape & Setting
        </label>
        <div className="flex flex-wrap gap-2">
          {environments.map((env) => {
            const isSelected = searchFilters.environments.includes(env.key);
            return (
              <button
                type="button"
                key={env.key}
                onClick={() => toggleEnvironment(env.key)}
                className={`px-3 py-1.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                    : 'bg-muted/70 text-foreground border-transparent hover:bg-muted'
                }`}
              >
                <span>{env.icon}</span>
                <span>{env.label}</span>
                <span className={`text-[10px] font-black opacity-75 ${isSelected ? 'text-white' : 'text-muted-foreground'}`}>
                  ({env.count})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* 4. Filter by US State */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-black text-muted-foreground block uppercase tracking-wider">
            Filter by US State
          </label>
          {searchFilters.stateCode && searchFilters.stateCode !== 'all' && (
            <button
              onClick={() => setSearchFilters((prev) => ({ ...prev, stateCode: 'all' }))}
              className="text-[10px] font-extrabold text-roo-500 hover:underline"
            >
              Clear State
            </button>
          )}
        </div>

        {/* Top State Quick Chips */}
        <div className="flex flex-wrap gap-1.5 pb-1">
          {topStates.slice(0, 8).map(([abbr, count]) => {
            const isSelected = searchFilters.stateCode === abbr;
            return (
              <button
                type="button"
                key={abbr}
                onClick={() =>
                  setSearchFilters((prev) => ({
                    ...prev,
                    stateCode: isSelected ? 'all' : abbr,
                  }))
                }
                className={`px-2.5 py-1 rounded-xl text-[11px] font-black transition-all border ${
                  isSelected
                    ? 'bg-roo-500 text-white border-roo-500 shadow-xs'
                    : 'bg-muted/60 hover:bg-muted text-foreground border-transparent'
                }`}
              >
                {abbr} ({count.toLocaleString()})
              </button>
            );
          })}
        </div>

        <select
          value={searchFilters.stateCode || 'all'}
          onChange={(e) => setSearchFilters((prev) => ({ ...prev, stateCode: e.target.value }))}
          className="w-full p-2.5 rounded-2xl bg-background border border-input text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
        >
          <option value="all">All 42 Represented States · Nationwide (9,780 havens)</option>
          {topStates.map(([abbr, count]) => {
            const state = US_STATES[abbr];
            return (
              <option key={abbr} value={abbr}>
                {state?.name || abbr} ({count.toLocaleString()} camps)
              </option>
            );
          })}
        </select>
      </div>

      <Separator />

      {/* 5. Featured & Handpicked Havens */}
      <div className="space-y-2.5">
        <label className="text-[11px] font-black text-muted-foreground block uppercase tracking-wider">
          Curated & Verified
        </label>
        <label className="flex items-center justify-between p-2.5 rounded-2xl bg-amber-50/70 border border-amber-200/60 hover:bg-amber-100/70 cursor-pointer group transition-colors">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={Boolean(searchFilters.featuredOnly)}
              onChange={(e) => setSearchFilters((prev) => ({ ...prev, featuredOnly: e.target.checked }))}
              className="rounded-md accent-amber-600 w-4 h-4 cursor-pointer"
            />
            <span className="text-amber-950 font-bold text-xs flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
              CampRoo Featured Gems Only
            </span>
          </div>
          <span className="text-[10px] font-black text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded-full">
            185 spots
          </span>
        </label>
      </div>
    </aside>
  );
};
