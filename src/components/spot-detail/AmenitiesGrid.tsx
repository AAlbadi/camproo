import React from 'react';
import { HookupsAndAmenities, ProximityInfo } from '../../types';
import {
  Zap,
  Droplet,
  Wifi,
  Flame,
  Trash2,
  Trees,
  Volume2,
  Dog,
  Bath,
  ShowerHead,
  Compass,
  MapPin,
  Fuel,
  ShoppingCart
} from 'lucide-react';

interface AmenitiesGridProps {
  amenities: HookupsAndAmenities;
  proximity: ProximityInfo;
}

export const AmenitiesGrid: React.FC<AmenitiesGridProps> = ({ amenities, proximity }) => {
  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-cream-200 shadow-soft space-y-6">
      <div className="pb-4 border-b border-cream-100">
        <h3 className="text-lg font-extrabold text-forest-950">Amenities & Hookups</h3>
        <p className="text-xs text-cream-900/60 font-medium">Provided by the host for roaming guests</p>
      </div>

      {/* Hookup Icons Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {/* Electricity */}
        <div className="p-3.5 rounded-2xl bg-cream-50 border border-cream-200/80 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-forest-950 block">Electricity</span>
            <span className="text-xs text-cream-900/70 capitalize font-medium">
              {amenities.electricity === 'none' ? 'None (Off-grid)' : `${amenities.electricity.toUpperCase()} Dedicated`}
            </span>
          </div>
        </div>

        {/* Water */}
        <div className="p-3.5 rounded-2xl bg-cream-50 border border-cream-200/80 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
            <Droplet className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-forest-950 block">Water</span>
            <span className="text-xs text-cream-900/70 capitalize font-medium">
              {amenities.water.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Sewer / Dump */}
        <div className="p-3.5 rounded-2xl bg-cream-50 border border-cream-200/80 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-forest-950 block">Sewer</span>
            <span className="text-xs text-cream-900/70 capitalize font-medium">
              {amenities.sewer.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Wi-Fi */}
        <div className="p-3.5 rounded-2xl bg-cream-50 border border-cream-200/80 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
            <Wifi className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-forest-950 block">Wi-Fi</span>
            <span className="text-xs text-cream-900/70 font-medium">
              {amenities.wifi ? amenities.wifiSpeed || 'Available' : 'No Wi-Fi'}
            </span>
          </div>
        </div>

        {/* Fire Pit */}
        <div className="p-3.5 rounded-2xl bg-cream-50 border border-cream-200/80 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-800 flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-forest-950 block">Campfire / Fire Pit</span>
            <span className="text-xs text-cream-900/70 font-medium">
              {amenities.firePit ? 'Permitted in designated ring' : 'No open fires'}
            </span>
          </div>
        </div>

        {/* Trash */}
        <div className="p-3.5 rounded-2xl bg-cream-50 border border-cream-200/80 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-stone-100 text-stone-800 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-forest-950 block">Trash Disposal</span>
            <span className="text-xs text-cream-900/70 font-medium">
              {amenities.trash ? 'Host bins provided' : 'Pack-it-in, pack-it-out'}
            </span>
          </div>
        </div>
      </div>

      {/* Surrounding Essentials & Proximity */}
      <div className="pt-4 border-t border-cream-100">
        <h4 className="text-xs font-bold uppercase tracking-wider text-forest-800 mb-3">Nearby Services & Attractions</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-cream-50 border border-cream-200 text-xs">
            <Fuel className="w-4 h-4 text-forest-700" />
            <span><strong>{proximity.fuelNearbyMiles} miles</strong> to diesel / fuel</span>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-cream-50 border border-cream-200 text-xs">
            <ShoppingCart className="w-4 h-4 text-forest-700" />
            <span><strong>{proximity.groceriesNearbyMiles} miles</strong> to groceries</span>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-cream-50 border border-cream-200 text-xs">
            <Compass className="w-4 h-4 text-forest-700" />
            <span><strong>{proximity.rvDumpNearbyMiles} miles</strong> to public dump</span>
          </div>
        </div>
        <p className="text-xs text-cream-900/80 italic mt-2.5">
          ★ {proximity.attractionNote}
        </p>
      </div>
    </div>
  );
};
