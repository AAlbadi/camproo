import * as React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface CalendarProps {
  selectedDate?: string;
  onSelectDate?: (date: string) => void;
  className?: string;
  minDate?: string;
}

export const Calendar: React.FC<CalendarProps> = ({
  selectedDate,
  onSelectDate,
  className,
  minDate
}) => {
  const [currentMonth, setCurrentMonth] = React.useState<Date>(() => {
    return selectedDate ? new Date(selectedDate) : new Date();
  });

  const monthYearStr = currentMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanksArray = Array.from({ length: startDayOfWeek }, (_, i) => i);

  const formatDateStr = (day: number) => {
    const y = currentMonth.getFullYear();
    const m = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  return (
    <div className={cn("p-4 rounded-3xl border border-border bg-card shadow-sm space-y-4 select-none", className)}>
      {/* Month Navigation Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-primary" />
          <span className="text-xs font-black text-foreground">{monthYearStr}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
        <span>Su</span>
        <span>Mo</span>
        <span>Tu</span>
        <span>We</span>
        <span>Th</span>
        <span>Fr</span>
        <span>Sa</span>
      </div>

      {/* Day Cells */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {blanksArray.map(b => (
          <div key={`blank-${b}`} className="h-8 w-8" />
        ))}

        {daysArray.map(day => {
          const dateStr = formatDateStr(day);
          const isSelected = selectedDate === dateStr;
          const isPast = minDate && dateStr < minDate;

          return (
            <button
              type="button"
              key={dateStr}
              disabled={Boolean(isPast)}
              onClick={() => onSelectDate && onSelectDate(dateStr)}
              className={cn(
                "h-8 w-8 mx-auto rounded-xl flex items-center justify-center font-bold transition-all text-xs",
                isSelected
                  ? "bg-primary text-primary-foreground shadow-sm scale-105"
                  : "text-foreground hover:bg-secondary hover:text-secondary-foreground",
                isPast && "opacity-30 pointer-events-none"
              )}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Roaming hint */}
      <div className="pt-2 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-primary inline-block" />
          <span>Selected Stay Date</span>
        </span>
        <span className="text-secondary-foreground font-semibold">100% Free US Stays</span>
      </div>
    </div>
  );
};
