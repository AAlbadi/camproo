import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Spot } from '../../types';
import { Truck, CheckCircle2, AlertTriangle, Eye, RotateCw, ShieldCheck, Compass, Zap, Droplets } from 'lucide-react';

interface SpatialRigVisualizerProps {
  spot: Spot;
}

export const SpatialRigVisualizer: React.FC<SpatialRigVisualizerProps> = ({ spot }) => {
  const [testLengthFt, setTestLengthFt] = useState<number>(spot.rigCompatibility.maxLengthFt - 4);
  const [viewAngle, setViewAngle] = useState<'3d' | 'top' | 'side'>('3d');
  const [isHookupConnected, setIsHookupConnected] = useState(true);

  const maxPadLength = spot.rigCompatibility.maxLengthFt;
  const isFits = testLengthFt <= maxPadLength;
  const marginFt = maxPadLength - testLengthFt;

  // 3D CSS transform style based on active angle
  const getTransform = () => {
    switch (viewAngle) {
      case '3d':
        return 'rotateX(55deg) rotateZ(-25deg)';
      case 'top':
        return 'rotateX(0deg) rotateZ(0deg)';
      case 'side':
        return 'rotateX(75deg) rotateZ(-80deg)';
    }
  };

  return (
    <div className="liquid-glass rounded-3xl p-6 border border-white/80 shadow-airbnb space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-roo-500 text-white text-[10px] font-black uppercase tracking-wider">
              3D Spatial Preview
            </span>
            <span className="text-xs font-bold text-dark-500">Live Pad Simulation</span>
          </div>
          <h3 className="text-lg font-black text-dark-900 mt-1">
            Pad Clearance & Rig Level Inspector
          </h3>
          <p className="text-xs text-dark-600 font-medium">
            Test your specific rig dimensions against {spot.locationName} pad limits in 3D.
          </p>
        </div>

        {/* View Angle Switcher */}
        <div className="flex items-center bg-white/80 p-1 rounded-2xl border border-dark-200/80 text-xs font-bold shadow-xs">
          <button
            onClick={() => setViewAngle('3d')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              viewAngle === '3d' ? 'bg-dark-900 text-white shadow-xs' : 'text-dark-600 hover:text-dark-900'
            }`}
          >
            3D Perspective
          </button>
          <button
            onClick={() => setViewAngle('top')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              viewAngle === 'top' ? 'bg-dark-900 text-white shadow-xs' : 'text-dark-600 hover:text-dark-900'
            }`}
          >
            Top-Down
          </button>
          <button
            onClick={() => setViewAngle('side')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              viewAngle === 'side' ? 'bg-dark-900 text-white shadow-xs' : 'text-dark-600 hover:text-dark-900'
            }`}
          >
            Clearance Profile
          </button>
        </div>
      </div>

      {/* Interactive 3D Spatial Canvas */}
      <div className="relative h-64 sm:h-72 w-full rounded-2xl bg-gradient-to-b from-dark-900 via-dark-800 to-black overflow-hidden flex items-center justify-center perspective-1000 shadow-inner">
        {/* Background Grid Lines (3D Spatial Horizon) */}
        <div className="absolute inset-0 opacity-15 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:32px_32px]" />

        {/* 3D Simulated Pad Stage */}
        <div
          style={{
            transform: getTransform(),
            transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
            transformStyle: 'preserve-3d',
          }}
          className="relative w-72 sm:w-88 h-40 rounded-2xl border-2 border-white/30 transition-all duration-500 shadow-2xl flex items-center justify-center bg-stone-700/60"
        >
          {/* Pad Surface Texture */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-stone-600/70 to-stone-800/90 flex flex-col justify-between p-3 pointer-events-none">
            <div className="flex justify-between text-[10px] font-mono text-white/50 tracking-wider">
              <span>ENTRY: {spot.rigCompatibility.accessType.replace('_', ' ').toUpperCase()}</span>
              <span>PAD: {maxPadLength} FT</span>
            </div>
            <div className="flex justify-between items-center text-[10px] font-mono text-white/50">
              <span>SURFACE: {spot.rigCompatibility.surfaceType.replace('_', ' ').toUpperCase()}</span>
              <span className="text-emerald-400 font-bold">LEVEL: 0.1°</span>
            </div>
          </div>

          {/* Electric Pedestal Pin in 3D */}
          <div
            style={{ transform: 'translateZ(20px)' }}
            className="absolute -top-3 -left-3 w-6 h-10 rounded-md bg-zinc-800 border border-zinc-600 flex flex-col items-center justify-center text-white shadow-lg"
          >
            <Zap className={`w-3.5 h-3.5 ${isHookupConnected ? 'text-amber-400 fill-amber-400' : 'text-zinc-500'}`} />
            <span className="text-[7px] font-bold mt-0.5">{spot.amenities.electricity.toUpperCase()}</span>
          </div>

          {/* 3D Vehicle Block on Pad */}
          <motion.div
            layout
            style={{
              width: `${Math.min(100, (testLengthFt / maxPadLength) * 80)}%`,
              transform: 'translateZ(24px)',
            }}
            className={`relative h-20 rounded-xl transition-all duration-300 flex items-center justify-between px-3 border shadow-2xl ${
              isFits
                ? 'bg-gradient-to-r from-roo-600 to-roo-500 border-roo-300 text-white shadow-roo-500/30'
                : 'bg-gradient-to-r from-rose-600 to-rose-700 border-rose-400 text-white shadow-rose-600/40'
            }`}
          >
            {/* Front of Rig */}
            <div className="flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-white" />
              <div className="text-[11px] font-black uppercase tracking-wider">{testLengthFt} FT RIG</div>
            </div>

            {/* Hookup Plug Line */}
            {isHookupConnected && (
              <div className="absolute -top-4 left-3 text-[9px] font-bold text-amber-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                <span>Connected to Pedestal</span>
              </div>
            )}

            {/* Rear of Rig */}
            <div className="text-[10px] font-mono font-bold opacity-80">
              {isFits ? `+${marginFt}ft clear` : `${Math.abs(marginFt)}ft overhang`}
            </div>
          </motion.div>
        </div>

        {/* Floating Spatial Overlay Pill */}
        <div className="absolute top-3 left-3 liquid-glass-dark px-3 py-1.5 rounded-xl text-white flex items-center gap-2 text-xs font-bold">
          <Compass className="w-3.5 h-3.5 text-roo-400 animate-spin" style={{ animationDuration: '10s' }} />
          <span>True North Orientation</span>
        </div>

        {/* Floating Fit Badge */}
        <div className="absolute bottom-3 right-3">
          {isFits ? (
            <div className="liquid-glass-dark px-3 py-1.5 rounded-xl text-emerald-400 flex items-center gap-1.5 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Verified Fit ({marginFt} ft leeway)</span>
            </div>
          ) : (
            <div className="liquid-glass-dark px-3 py-1.5 rounded-xl text-rose-300 flex items-center gap-1.5 text-xs font-bold">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Rig exceeds pad by {Math.abs(marginFt)} ft</span>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Controls Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-white/70 p-4 rounded-2xl border border-dark-200/80">
        {/* RV Length Slider */}
        <div className="md:col-span-7 space-y-1.5">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-dark-800">Your RV Length:</span>
            <span className="text-roo-600 font-extrabold">{testLengthFt} ft (Pad max: {maxPadLength} ft)</span>
          </div>
          <input
            type="range"
            min={16}
            max={45}
            step={1}
            value={testLengthFt}
            onChange={(e) => setTestLengthFt(Number(e.target.value))}
            className="w-full accent-roo-500 h-2 bg-dark-200 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-dark-500 font-semibold">
            <span>16 ft (Campervan)</span>
            <span>30 ft (Class C)</span>
            <span>45 ft (Max Class A)</span>
          </div>
        </div>

        {/* Inclinometer Pitch/Roll Info */}
        <div className="md:col-span-5 grid grid-cols-2 gap-2 border-t md:border-t-0 md:border-l border-dark-200/80 md:pl-4">
          <div className="p-2.5 rounded-xl bg-white border border-dark-200/70">
            <span className="text-[10px] font-bold text-dark-500 block">PAD GRADE LEVEL</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-black text-dark-900">{spot.rigCompatibility.isLevel ? 'Level (< 0.5°)' : 'Slight Slant'}</span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-white border border-dark-200/70">
            <span className="text-[10px] font-bold text-dark-500 block">HEIGHT CLEARANCE</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs font-black text-dark-900">{spot.rigCompatibility.maxHeightFt} ft Max</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
