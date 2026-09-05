import React, { useState } from 'react';
import { Spot } from '../../types';
import { Truck, CheckCircle2, AlertTriangle } from 'lucide-react';

interface SpatialRigVisualizerProps {
  spot: Spot;
  defaultRigLength?: number;
}

export const SpatialRigVisualizer: React.FC<SpatialRigVisualizerProps> = ({
  spot,
  defaultRigLength,
}) => {
  const maxPadLength = spot.rigCompatibility.maxLengthFt;
  const initialLength = defaultRigLength
    ? Math.min(defaultRigLength, maxPadLength + 10)
    : Math.max(16, Math.min(maxPadLength - 4, 30));

  const [testLengthFt, setTestLengthFt] = useState<number>(initialLength);

  const marginFt = maxPadLength - testLengthFt;
  const isFits = marginFt >= 0;
  const isTight = marginFt >= 0 && marginFt <= 3;

  // Percentage of pad occupied by the tested rig
  const vehiclePercent = Math.min(100, Math.max(15, (testLengthFt / maxPadLength) * 100));

  return (
    <div className="bg-card rounded-3xl p-6 sm:p-7 border border-border shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 text-[10px] font-black uppercase tracking-wider">
              Pad Clearance Tool
            </span>
            <span className="text-xs font-semibold text-muted-foreground">Live Rig Fit Check</span>
          </div>
          <h3 className="text-lg font-black text-foreground mt-1">
            Pad Clearance & Rig Level Inspector
          </h3>
          <p className="text-xs text-muted-foreground font-medium">
            Test your specific RV or trailer length against the pad limits for {spot.title}.
          </p>
        </div>

        {/* Status Badge */}
        <div className="shrink-0">
          {isFits ? (
            <div
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 border ${
                isTight
                  ? 'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/50 dark:text-amber-200'
                  : 'bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-200'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>
                {isTight ? `Tight Fit (${marginFt}ft buffer)` : `Verified Fit (${marginFt}ft clearance)`}
              </span>
            </div>
          ) : (
            <div className="px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 bg-rose-50 text-rose-900 border border-rose-300 dark:bg-rose-950/50 dark:text-rose-200">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>Overhang Danger (+{Math.abs(marginFt)}ft too long)</span>
            </div>
          )}
        </div>
      </div>

      {/* Visual Clearance Diagram */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
          <span>Entrance ({spot.rigCompatibility.accessType.replace('_', ' ')})</span>
          <span>Pad Max: {maxPadLength} ft</span>
        </div>

        {/* Scaled Pad Stage */}
        <div className="relative h-28 w-full rounded-2xl bg-secondary/70 border-2 border-dashed border-border overflow-hidden flex items-center px-4">
          {/* Surface texture indicator badge */}
          <div className="absolute top-2 right-3 text-[10px] font-mono text-muted-foreground uppercase tracking-wider bg-background/80 px-2 py-0.5 rounded-md border border-border">
            Surface: {spot.rigCompatibility.surfaceType.replace('_', ' ')}
          </div>

          {/* Scaled RV Bar */}
          <div
            style={{ width: `${Math.min(100, vehiclePercent)}%` }}
            className={`relative h-14 rounded-xl transition-all duration-300 flex items-center justify-between px-3.5 shadow-md border ${
              !isFits
                ? 'bg-rose-500 text-white border-rose-600'
                : isTight
                ? 'bg-amber-500 text-white border-amber-600'
                : 'bg-emerald-700 text-white border-emerald-800'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <Truck className="w-5 h-5 shrink-0 text-white" />
              <div className="text-xs font-black tracking-wide truncate">
                {testLengthFt} FT RIG
              </div>
            </div>

            <div className="text-[11px] font-mono font-bold shrink-0 ml-2 bg-black/20 px-2 py-0.5 rounded">
              {isFits ? `+${marginFt}ft clear` : `-${Math.abs(marginFt)}ft overhang`}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive RV Length Slider */}
      <div className="p-4 rounded-2xl bg-secondary/40 border border-border space-y-2.5">
        <div className="flex items-center justify-between">
          <label htmlFor="rv-length-slider" className="text-xs font-extrabold text-foreground flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            <span>Adjust Your RV / Trailer Length:</span>
          </label>
          <span className="text-sm font-black text-foreground font-mono bg-background px-2.5 py-0.5 rounded-lg border border-border">
            {testLengthFt} ft
          </span>
        </div>

        <input
          id="rv-length-slider"
          type="range"
          min="12"
          max={Math.max(48, maxPadLength + 8)}
          value={testLengthFt}
          onChange={(e) => setTestLengthFt(Number(e.target.value))}
          className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-emerald-700"
        />

        <div className="flex justify-between text-[11px] font-bold text-muted-foreground pt-1">
          <span>16 ft (Van)</span>
          <span>25 ft (Class C)</span>
          <span>35 ft (Large Rig)</span>
          <span>45 ft (Class A)</span>
        </div>
      </div>

      {/* Key Pad Specs Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
        <div className="p-3 rounded-2xl bg-background border border-border">
          <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
            Max Pad Length
          </span>
          <span className="text-lg font-black text-foreground mt-0.5 block">
            {maxPadLength} ft
          </span>
          <span className="text-[10px] text-muted-foreground">Bumper-to-hitch</span>
        </div>

        <div className="p-3 rounded-2xl bg-background border border-border">
          <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
            Height Clearance
          </span>
          <span className="text-lg font-black text-foreground mt-0.5 block">
            {spot.rigCompatibility.maxHeightFt || 13.5} ft
          </span>
          <span className="text-[10px] text-muted-foreground">Overhead branches</span>
        </div>

        <div className="p-3 rounded-2xl bg-background border border-border">
          <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
            Driveway Access
          </span>
          <span className="text-sm font-black text-foreground mt-1 capitalize block truncate">
            {spot.rigCompatibility.accessType.replace('_', ' ')}
          </span>
          <span className="text-[10px] text-muted-foreground">Turn-around space</span>
        </div>

        <div className="p-3 rounded-2xl bg-background border border-border">
          <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
            Pad Grade
          </span>
          <span className="text-sm font-black text-emerald-700 dark:text-emerald-400 mt-1 block">
            {spot.rigCompatibility.isLevel ? 'Level Ground' : 'Slight Incline'}
          </span>
          <span className="text-[10px] text-muted-foreground">Blocks recommended</span>
        </div>
      </div>
    </div>
  );
};
