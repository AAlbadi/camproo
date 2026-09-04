import React from 'react';
import { useApp } from '../../context/AppContext';
import { RVType, RV_TYPE_LABELS, EnvironmentType } from '../../types';
import {
  SlidersHorizontal,
  RotateCcw,
  Zap,
  Droplet,
  Wifi,
  Flame,
  VolumeX,
  Dog,
  Compass,
  Sparkles,
  Users,
  Sun,
  ShieldCheck
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Slider } from '../ui/slider';
import { Separator } from '../ui/separator';

interface FilterPanelProps {
  className?: string;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({ className = '' }) => {
  const { searchFilters, setSearchFilters, resetFilters } = useApp();

  const environments: { key: EnvironmentType; label: string; icon: string }[] = [
    { key: 'desert', label: 'Desert', icon: '🏜️' },
    { key: 'farm', label: 'Farm', icon: '🚜' },
    { key: 'mountain', label: 'Mountain', icon: '⛰️' },
    { key: 'forest', label: 'Forest', icon: '🌲' },
    { key: 'coastal', label: 'Coastal', icon: '🌊' },
    { key: 'vineyard', label: 'Vineyard', icon: '🍇' },
    { key: 'rural', label: 'Rural', icon: '🌾' },
    { key: 'residential', label: 'Quiet Driveway', icon: '🏡' },
  ];

  const toggleEnvironment = (env: EnvironmentType) => {
    setSearchFilters(prev => {
      const exists = prev.environments.includes(env);
      return {
        ...prev,
        environments: exists
          ? prev.environments.filter(e => e !== env)
          : [...prev.environments, env],
      };
    });
  };

  return (
    <aside className={`bg-card rounded-3xl p-5 border border-border shadow-sm space-y-5 select-none ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-primary" />
          <h3 className="font-black text-sm text-foreground">Outdoor Filters</h3>
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
          $0 USD Peer Roaming
        </span>
        <Badge variant="free">
          100% FREE
        </Badge>
      </div>

      <Separator />

      {/* RV Length Slider (shadcn Slider) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-foreground">
          <span>Minimum Rig Clearance</span>
          <Badge variant="secondary" className="font-mono text-xs">
            {searchFilters.maxLengthFt} ft
          </Badge>
        </div>
        <Slider
          min={20}
          max={45}
          step={1}
          value={searchFilters.maxLengthFt}
          onChange={val => setSearchFilters(prev => ({ ...prev, maxLengthFt: val }))}
        />
        <div className="flex justify-between text-[10px] text-muted-foreground font-semibold">
          <span>20 ft (Vans)</span>
          <span>32 ft (Class C)</span>
          <span>45 ft (Class A)</span>
        </div>
      </div>

      <Separator />

      {/* RV Type Select */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-foreground block">Accepted Vehicle Class</label>
        <select
          value={searchFilters.rvType}
          onChange={e => setSearchFilters(prev => ({ ...prev, rvType: e.target.value as RVType | 'any' }))}
          className="w-full p-2.5 rounded-xl bg-background border border-input text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="any">Any RV Type · All Allowed</option>
          {Object.entries(RV_TYPE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      <Separator />

      {/* Hookups & Utilities */}
      <div className="space-y-2.5">
        <label className="text-[11px] font-black text-muted-foreground block uppercase tracking-wider">Hookups & Utilities</label>
        <div className="space-y-2 text-xs">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={searchFilters.electricRequired === '30amp'}
              onChange={e => setSearchFilters(prev => ({
                ...prev,
                electricRequired: e.target.checked ? '30amp' : 'any'
              }))}
              className="rounded-md accent-primary w-4 h-4 cursor-pointer"
            />
            <span className="text-foreground group-hover:text-primary font-semibold flex items-center gap-1.5 transition-colors">
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              Electricity (30A / 50A Pedestal)
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={searchFilters.waterRequired}
              onChange={e => setSearchFilters(prev => ({ ...prev, waterRequired: e.target.checked }))}
              className="rounded-md accent-primary w-4 h-4 cursor-pointer"
            />
            <span className="text-foreground group-hover:text-primary font-semibold flex items-center gap-1.5 transition-colors">
              <Droplet className="w-3.5 h-3.5 text-blue-500 fill-blue-500" />
              Potable Water Hookup
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={searchFilters.sewerRequired}
              onChange={e => setSearchFilters(prev => ({ ...prev, sewerRequired: e.target.checked }))}
              className="rounded-md accent-primary w-4 h-4 cursor-pointer"
            />
            <span className="text-foreground group-hover:text-primary font-semibold flex items-center gap-1.5 transition-colors">
              <Compass className="w-3.5 h-3.5 text-emerald-600" />
              Sewer / Dump Station
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={searchFilters.wifiRequired}
              onChange={e => setSearchFilters(prev => ({ ...prev, wifiRequired: e.target.checked }))}
              className="rounded-md accent-primary w-4 h-4 cursor-pointer"
            />
            <span className="text-foreground group-hover:text-primary font-semibold flex items-center gap-1.5 transition-colors">
              <Wifi className="w-3.5 h-3.5 text-forest-700" />
              High-Speed Wi-Fi / Starlink
            </span>
          </label>
        </div>
      </div>

      <Separator />

      {/* Driveway & Surface Specs */}
      <div className="space-y-2.5">
        <label className="text-[11px] font-black text-muted-foreground block uppercase tracking-wider">Driveway & Surface</label>
        <div className="space-y-2 text-xs">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={searchFilters.pullThroughOnly}
              onChange={e => setSearchFilters(prev => ({ ...prev, pullThroughOnly: e.target.checked }))}
              className="rounded-md accent-primary w-4 h-4 cursor-pointer"
            />
            <span className="text-foreground group-hover:text-primary font-semibold transition-colors">
              Pull-Through Driveway Only
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={searchFilters.levelGroundOnly}
              onChange={e => setSearchFilters(prev => ({ ...prev, levelGroundOnly: e.target.checked }))}
              className="rounded-md accent-primary w-4 h-4 cursor-pointer"
            />
            <span className="text-foreground group-hover:text-primary font-semibold transition-colors">
              Level Ground Guaranteed (&lt; 0.5°)
            </span>
          </label>
        </div>
      </div>

      <Separator />

      {/* Atmosphere & Policies */}
      <div className="space-y-2.5">
        <label className="text-[11px] font-black text-muted-foreground block uppercase tracking-wider">Atmosphere & Policies</label>
        <div className="space-y-2 text-xs">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={searchFilters.petsAllowed}
              onChange={e => setSearchFilters(prev => ({ ...prev, petsAllowed: e.target.checked }))}
              className="rounded-md accent-primary w-4 h-4 cursor-pointer"
            />
            <span className="text-foreground group-hover:text-primary font-semibold flex items-center gap-1.5 transition-colors">
              <Dog className="w-3.5 h-3.5 text-amber-700" /> Pets Allowed
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={searchFilters.campfireAllowed}
              onChange={e => setSearchFilters(prev => ({ ...prev, campfireAllowed: e.target.checked }))}
              className="rounded-md accent-primary w-4 h-4 cursor-pointer"
            />
            <span className="text-foreground group-hover:text-primary font-semibold flex items-center gap-1.5 transition-colors">
              <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" /> Campfires Allowed
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={searchFilters.quietOnly}
              onChange={e => setSearchFilters(prev => ({ ...prev, quietOnly: e.target.checked }))}
              className="rounded-md accent-primary w-4 h-4 cursor-pointer"
            />
            <span className="text-foreground group-hover:text-primary font-semibold flex items-center gap-1.5 transition-colors">
              <VolumeX className="w-3.5 h-3.5 text-forest-700" /> Quiet Setting Only
            </span>
          </label>
        </div>
      </div>

      <Separator />

      {/* Environments */}
      <div className="space-y-2.5">
        <label className="text-[11px] font-black text-muted-foreground block uppercase tracking-wider">Setting & Environment</label>
        <div className="flex flex-wrap gap-1.5">
          {environments.map(env => {
            const isSelected = searchFilters.environments.includes(env.key);
            return (
              <button
                type="button"
                key={env.key}
                onClick={() => toggleEnvironment(env.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-muted/70 text-foreground hover:bg-muted'
                }`}
              >
                <span>{env.icon}</span>
                <span>{env.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
