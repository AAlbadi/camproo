import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { Search, MapPin, Calendar as CalendarIcon, Sparkles, X, Check, Trees } from 'lucide-react';
import { Calendar } from '../ui/calendar';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

export const SearchBar: React.FC = () => {
  const { searchFilters, setSearchFilters, setCurrentView } = useApp();
  const [activeTab, setActiveTab] = useState<'where' | 'dates' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close popover on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveTab(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setActiveTab(null);
    setCurrentView('explore');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const popularLocations = [
    { name: 'Moab', state: 'Utah', icon: '🏜️' },
    { name: 'Sedona', state: 'Arizona', icon: '⛰️' },
    { name: 'Lake Tahoe', state: 'California', icon: '🌲' },
    { name: 'Bend', state: 'Oregon', icon: '🌲' },
    { name: 'Yellowstone', state: 'Wyoming', icon: '🐻' },
    { name: 'Joshua Tree', state: 'California', icon: '🌵' },
  ];

  return (
    <div ref={containerRef} className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 relative z-30">
      <motion.form
        onSubmit={handleSubmit}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="liquid-glass rounded-full p-2 sm:p-2.5 shadow-search hover:shadow-search-hover border border-border/80 transition-all duration-300 flex flex-col md:flex-row items-center divide-y md:divide-y-0 md:divide-x divide-border relative"
      >
        {/* Where Input */}
        <div
          onClick={() => setActiveTab(activeTab === 'where' ? null : 'where')}
          className={`w-full md:w-6/12 px-6 py-2.5 rounded-full transition-colors cursor-pointer ${
            activeTab === 'where' ? 'bg-card shadow-sm ring-1 ring-border' : 'hover:bg-muted/40'
          }`}
        >
          <span className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            Where to roam
          </span>
          <input
            type="text"
            placeholder="Search area (e.g. Sedona, Lake Tahoe, Moab, California)..."
            value={searchFilters.locationQuery}
            onChange={(e) => setSearchFilters(prev => ({ ...prev, locationQuery: e.target.value }))}
            className="w-full bg-transparent text-xs sm:text-sm font-bold text-foreground placeholder:text-muted-foreground/60 focus:outline-none truncate"
          />
        </div>

        {/* When (Dates with shadcn Calendar) */}
        <div
          onClick={() => setActiveTab(activeTab === 'dates' ? null : 'dates')}
          className={`w-full md:w-3/12 px-5 py-2.5 rounded-full transition-colors cursor-pointer ${
            activeTab === 'dates' ? 'bg-card shadow-sm ring-1 ring-border' : 'hover:bg-muted/40'
          }`}
        >
          <span className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            When
          </span>
          <div className="flex items-center gap-1.5 text-xs font-bold text-foreground mt-0.5">
            <CalendarIcon className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="truncate">
              {searchFilters.arrivalDate
                ? new Date(searchFilters.arrivalDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : 'Select stay dates'}
            </span>
          </div>
        </div>

        {/* Explore CTA */}
        <div
          onClick={() => handleSubmit()}
          className="w-full md:w-3/12 pl-5 pr-2 py-2 rounded-full transition-colors cursor-pointer flex items-center justify-between gap-2 hover:bg-muted/40"
        >
          <div className="flex-1 min-w-0">
            <span className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Public Lands
            </span>
            <div className="text-xs font-bold text-foreground truncate flex items-center gap-1 mt-0.5">
              <Sparkles className="w-3 h-3 text-roo-500" />
              <span>100% Free</span>
            </div>
          </div>

          {/* Search CTA Button */}
          <Button
            type="submit"
            size="icon"
            className="h-12 w-12 rounded-full shadow-md shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Search className="w-5 h-5 stroke-[2.5]" />
          </Button>
        </div>
      </motion.form>

      {/* Floating Dropdown Panels */}
      <AnimatePresence>
        {activeTab === 'where' && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ type: 'spring', damping: 25, stiffness: 320 }}
            className="absolute left-4 sm:left-8 top-full mt-3 w-80 sm:w-96 rounded-3xl border border-border bg-card p-5 shadow-airbnb-hover z-40"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Popular US RV & Camping Havens
              </span>
              <Badge variant="free">100% Free</Badge>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {popularLocations.map(loc => (
                <button
                  type="button"
                  key={loc.name}
                  onClick={() => {
                    setSearchFilters(prev => ({ ...prev, locationQuery: loc.name }));
                    setActiveTab(null);
                    setCurrentView('explore');
                  }}
                  className="flex items-center gap-2.5 p-2.5 rounded-2xl hover:bg-muted text-left transition-colors group"
                >
                  <span className="text-lg">{loc.icon}</span>
                  <div>
                    <div className="text-xs font-bold text-foreground group-hover:text-primary">
                      {loc.name}
                    </div>
                    <div className="text-[10px] text-muted-foreground">{loc.state}</div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'dates' && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ type: 'spring', damping: 25, stiffness: 320 }}
            className="absolute left-1/2 -translate-x-1/2 top-full mt-3 w-80 sm:w-88 rounded-3xl border border-border bg-card shadow-airbnb-hover z-40 overflow-hidden"
          >
            <Calendar
              selectedDate={searchFilters.arrivalDate}
              onSelectDate={(date) => {
                setSearchFilters(prev => ({ ...prev, arrivalDate: date }));
                setActiveTab(null);
              }}
              minDate={new Date().toISOString().split('T')[0]}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
