import React from 'react';
import { RVType, RV_TYPE_LABELS } from '../../types';
import { Truck, Compass, ShieldCheck, Zap } from 'lucide-react';

interface RigBadgeProps {
  type: RVType;
  size?: 'sm' | 'md';
  className?: string;
}

export const RigBadge: React.FC<RigBadgeProps> = ({ type, size = 'sm', className = '' }) => {
  const label = RV_TYPE_LABELS[type] || type;

  const colorStyles: Record<string, string> = {
    class_a: 'bg-emerald-100/70 text-emerald-800 border-emerald-200',
    class_b: 'bg-blue-100/70 text-blue-800 border-blue-200',
    class_c: 'bg-amber-100/70 text-amber-800 border-amber-200',
    travel_trailer: 'bg-purple-100/70 text-purple-800 border-purple-200',
    fifth_wheel: 'bg-orange-100/70 text-orange-800 border-orange-200',
    campervan: 'bg-teal-100/70 text-teal-800 border-teal-200',
    truck_camper: 'bg-stone-200/70 text-stone-800 border-stone-300',
    rooftop_tent: 'bg-lime-100/70 text-lime-800 border-lime-200',
  };

  const style = colorStyles[type] || 'bg-cream-200 text-cream-900 border-cream-300';
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm font-medium';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${sizeClass} ${style} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
};
