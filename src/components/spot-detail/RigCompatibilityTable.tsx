import React from 'react';
import { RigCompatibility, RV_TYPE_LABELS } from '../../types';
import { Truck, Check, X, AlertTriangle, Compass, Maximize, CornerUpRight } from 'lucide-react';

interface RigCompatibilityTableProps {
  compat: RigCompatibility;
  travelerRigLength?: number;
}

export const RigCompatibilityTable: React.FC<RigCompatibilityTableProps> = ({
  compat,
  travelerRigLength,
}) => {
  const isCompatible = travelerRigLength ? travelerRigLength <= compat.maxLengthFt : true;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-cream-200 shadow-soft space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-cream-100">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-forest-100 flex items-center justify-center text-forest-800">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-forest-950">RV Compatibility & Dimensions</h3>
            <p className="text-xs text-cream-900/60 font-medium">Verify your vehicle dimensions before arrival</p>
          </div>
        </div>

        {travelerRigLength && (
          <div
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
              isCompatible
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}
          >
            {isCompatible ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Fits your {travelerRigLength}ft rig</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>Exceeds max limit ({travelerRigLength}ft vs {compat.maxLengthFt}ft)</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Numerical Limits Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-cream-50 border border-cream-200/80">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-forest-700 block">Max Length</span>
          <span className="text-2xl font-extrabold text-forest-950 mt-0.5 block">{compat.maxLengthFt} ft</span>
          <span className="text-[10px] text-cream-900/60 font-medium">Bumper-to-hitch</span>
        </div>

        <div className="p-4 rounded-2xl bg-cream-50 border border-cream-200/80">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-forest-700 block">Max Height</span>
          <span className="text-2xl font-extrabold text-forest-950 mt-0.5 block">{compat.maxHeightFt} ft</span>
          <span className="text-[10px] text-cream-900/60 font-medium">Overhead clearance</span>
        </div>

        <div className="p-4 rounded-2xl bg-cream-50 border border-cream-200/80">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-forest-700 block">Max Width</span>
          <span className="text-2xl font-extrabold text-forest-950 mt-0.5 block">{compat.maxWidthFt} ft</span>
          <span className="text-[10px] text-cream-900/60 font-medium">With slides out</span>
        </div>

        <div className="p-4 rounded-2xl bg-cream-50 border border-cream-200/80">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-forest-700 block">Driveway Style</span>
          <span className="text-base font-extrabold text-forest-950 mt-1 capitalize block">
            {compat.accessType.replace('_', ' ')}
          </span>
          <span className="text-[10px] text-emerald-700 font-medium">{compat.isLevel ? 'Level Ground' : 'Slight Incline'}</span>
        </div>
      </div>

      {/* Vehicle Class Matrix */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-forest-800 mb-3">Accepted Rig Classes</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {Object.entries(RV_TYPE_LABELS).map(([key, label]) => {
            const accepted = compat.acceptedTypes.includes(key as any);
            return (
              <div
                key={key}
                className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-semibold ${
                  accepted
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                    : 'bg-cream-50/50 border-cream-200 text-cream-400 line-through opacity-60'
                }`}
              >
                <span className="truncate">{label}</span>
                {accepted ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-1" />
                ) : (
                  <X className="w-3.5 h-3.5 text-cream-400 shrink-0 ml-1" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Maneuvering Notes */}
      <div className="space-y-3 pt-2">
        <div className="p-4 rounded-2xl bg-cream-50 border border-cream-200 text-xs text-cream-900/90 leading-relaxed">
          <div className="font-bold text-forest-950 flex items-center gap-1.5 mb-1">
            <CornerUpRight className="w-4 h-4 text-forest-700" />
            Turnaround & Access Space
          </div>
          {compat.turnaroundSpace}
        </div>

        {compat.lowClearanceNotice && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 leading-relaxed flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Clearance Note:</span> {compat.lowClearanceNotice}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
