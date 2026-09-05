import React from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import {
  Compass,
  Heart,
  PlusCircle,
  User as UserIcon,
} from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    currentUser,
    savedSpotIds,
    isAuthenticated,
  } = useApp();

  const handleNavigate = (view: string) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isExploreActive = currentView === 'home' || currentView === 'explore';

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-[600] bg-white/95 backdrop-blur-2xl border-t border-dark-200/90 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] pb-[calc(env(safe-area-inset-bottom,8px)+6px)] pt-1.5 px-2 select-none"
    >
      <div className="grid grid-cols-5 items-center max-w-md mx-auto">
        {/* 1. Explore */}
        <button
          onClick={() => handleNavigate('explore')}
          className={`flex flex-col items-center justify-center py-1 relative touch-manipulation transition-all ${
            isExploreActive ? 'text-roo-500' : 'text-dark-600 hover:text-dark-950'
          }`}
        >
          <div className="relative p-1">
            <Compass className={`w-5 h-5 transition-transform ${isExploreActive ? 'scale-110 stroke-[2.5]' : 'stroke-2'}`} />
            {isExploreActive && (
              <motion.span
                layoutId="mobileNavDot"
                className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-roo-500"
              />
            )}
          </div>
          <span className={`text-[10px] tracking-tight leading-tight mt-0.5 ${isExploreActive ? 'font-black' : 'font-semibold'}`}>
            Explore
          </span>
        </button>

        {/* 2. Liked (Trips) */}
        <button
          onClick={() => handleNavigate('trips')}
          className={`flex flex-col items-center justify-center py-1 relative touch-manipulation transition-all ${
            currentView === 'trips' ? 'text-roo-500' : 'text-dark-600 hover:text-dark-950'
          }`}
        >
          <div className="relative p-1">
            <Heart className={`w-5 h-5 transition-transform ${currentView === 'trips' ? 'scale-110 stroke-[2.5] fill-roo-500 text-roo-500' : 'stroke-2'}`} />
            {savedSpotIds.length > 0 && (
              <span className="absolute -top-0.5 -right-1 min-w-[15px] h-[15px] px-1 rounded-full bg-roo-500 text-white text-[9px] font-black flex items-center justify-center ring-2 ring-white">
                {savedSpotIds.length}
              </span>
            )}
            {currentView === 'trips' && (
              <motion.span
                layoutId="mobileNavDot"
                className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-roo-500"
              />
            )}
          </div>
          <span className={`text-[10px] tracking-tight leading-tight mt-0.5 ${currentView === 'trips' ? 'font-black' : 'font-semibold'}`}>
            Liked
          </span>
        </button>

        {/* 3. Host / Share A Spot (Center Action) */}
        <button
          onClick={() => handleNavigate('host-onboarding')}
          className="flex flex-col items-center justify-center -mt-3 relative touch-manipulation group"
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-roo-500 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-roo-500/30 group-active:scale-95 transition-transform border-2 border-white">
            <PlusCircle className="w-6 h-6 stroke-[2.2]" />
          </div>
          <span className="text-[10px] tracking-tight font-black text-dark-900 leading-tight mt-1">
            Share Spot
          </span>
        </button>

        {/* 4. Buy Me a Coffee (Replaces Inbox) */}
        <a
          href="https://buymeacoffee.com/camproo"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center py-1 relative touch-manipulation text-amber-700 hover:text-amber-800 transition-all group"
        >
          <div className="relative p-1">
            <span className="text-lg group-hover:scale-110 transition-transform">☕</span>
          </div>
          <span className="text-[10px] tracking-tight font-extrabold text-amber-800 leading-tight mt-0.5">
            Coffee
          </span>
        </a>

        {/* 5. Profile */}
        <button
          onClick={() => handleNavigate('profile')}
          className={`flex flex-col items-center justify-center py-1 relative touch-manipulation transition-all ${
            currentView === 'profile' ? 'text-roo-500' : 'text-dark-600 hover:text-dark-950'
          }`}
        >
          <div className="relative p-1">
            {isAuthenticated && currentUser.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className={`w-5 h-5 rounded-full object-cover ring-1 ${currentView === 'profile' ? 'ring-roo-500 ring-2' : 'ring-dark-300'}`}
              />
            ) : (
              <UserIcon className={`w-5 h-5 transition-transform ${currentView === 'profile' ? 'scale-110 stroke-[2.5]' : 'stroke-2'}`} />
            )}
            {currentView === 'profile' && (
              <motion.span
                layoutId="mobileNavDot"
                className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-roo-500"
              />
            )}
          </div>
          <span className={`text-[10px] tracking-tight leading-tight mt-0.5 ${currentView === 'profile' ? 'font-black' : 'font-semibold'}`}>
            Profile
          </span>
        </button>
      </div>
    </nav>
  );
};
