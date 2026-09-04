import * as React from 'react';
import { cn } from '../../lib/utils';

export interface SliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (val: number) => void;
  className?: string;
}

export const Slider: React.FC<SliderProps> = ({
  value,
  min = 10,
  max = 45,
  step = 1,
  onChange,
  className
}) => {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={cn("relative flex w-full touch-none select-none items-center py-2", className)}>
      <div className="relative h-2 w-full grow overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-all duration-150"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      {/* Visual Thumb */}
      <div
        style={{ left: `calc(${percentage}% - 10px)` }}
        className="pointer-events-none absolute h-5 w-5 rounded-full border-2 border-primary bg-background shadow-md transition-all flex items-center justify-center"
      >
        <div className="h-2 w-2 rounded-full bg-primary" />
      </div>
    </div>
  );
};
