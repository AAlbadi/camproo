import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { MascotBadge } from './MascotBadge';
import { AuthModal } from './AuthModal';
import { TrafficAnalyticsModal } from '../admin/TrafficAnalyticsModal';
import { Button, Badge, Avatar, AvatarImage, AvatarFallback } from '../ui';
import {
  Compass,
  MessageSquare,
  Car,
  Home,
  ShieldCheck,
  Users,
  Menu,
  X,
  Search,
  PlusCircle,
  Sparkles,
  ShieldAlert,
  UserPlus,
  BarChart3,
  LogOut,
  User as UserIcon
} from 'lucide-react';

import { MapSearchBar, AreaSelectPayload } from '../explore/MapSearchBar';

export const Navbar: React.FC = () => {
  const {
    currentUser,
    users,
    switchUser,
    currentView,
    setCurrentView,
    requests,
    threads,
    isAdminAuthenticated,
    isAuthenticated,
    logout,
    adminLogout,
    spots,
    searchFilters,
    setSearchFilters,
    isLocating,
    handleNearMe,
    setTargetView,
    userLocation,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [analyticsModalOpen, setAnalyticsModalOpen] = useState(false);

  const isUserAdmin = isAdminAuthenticated || currentUser.role === 'admin';

  // Calculate notification counters
  const pendingRequestsForHost = requests.filter(
    r => r.hostId === currentUser.id && r.status === 'pending'
  ).length;

  const unreadMessagesCount = threads.filter(
    t => t.unreadBy.includes(currentUser.id)
  ).length;

  const handleNav = (view: string) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <header className="sticky top-0 z-[1000] liquid-glass bg-white/95 backdrop-blur-xl border-b border-white/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] transition-all">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
            {/* Left: CampRoo Brand Mark */}
            <div
              onClick={() => handleNav('home')}
              className="cursor-pointer transition-transform hover:scale-[1.02] shrink-0 flex items-center"
            >
              <MascotBadge size="md" tagline="WHERE RVERS HELP RVERS" />
            </div>

            {/* Center: Integrated Liquid Glass Search Bar (Level 1) */}
            <div className="flex-1 max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl mx-1 sm:mx-2">
              <MapSearchBar
                spots={spots}
                value={searchFilters.locationQuery}
                onChange={(q) => setSearchFilters((prev) => ({ ...prev, locationQuery: q }))}
                onSelectArea={(payload: AreaSelectPayload) => {
                  setSearchFilters((prev) => ({
                    ...prev,
                    locationQuery: payload.title,
                    stateCode: payload.stateAbbr || 'all',
                    searchCenter: payload.center,
                    searchRadiusMiles: payload.radiusMiles || 50,
                  }));
                  if (payload.bbox) {
                    setTargetView({
                      bounds: {
                        southWest: { lat: payload.bbox[0], lng: payload.bbox[1] },
                        northEast: { lat: payload.bbox[2], lng: payload.bbox[3] },
                      },
                      timestamp: Date.now(),
                    });
                  } else if (payload.center) {
                    setTargetView({
                      center: payload.center,
                      zoom: payload.zoom || 10,
                      timestamp: Date.now(),
                    });
                  }
                  if (currentView !== 'explore' && currentView !== 'home') {
                    handleNav('explore');
                  }
                }}
                onClear={() => {
                  setSearchFilters((prev) => ({
                    ...prev,
                    locationQuery: '',
                    stateCode: 'all',
                    searchCenter: undefined,
                    searchRadiusMiles: undefined,
                  }));
                  setTargetView({
                    center: [39.5, -98.35],
                    zoom: 5,
                    timestamp: Date.now(),
                  });
                }}
                onNearMe={handleNearMe}
                isLocating={isLocating}
                placeholder="Search city, state, or park (e.g. Idaho, Montana, Sedona)..."
                userLocation={userLocation}
                activeTripRoute={searchFilters.tripRoute}
                onSelectTripRoute={(trip) => {
                  setSearchFilters((prev) => ({
                    ...prev,
                    tripRoute: trip,
                    locationQuery: '',
                    searchCenter: undefined,
                    searchRadiusMiles: undefined,
                  }));
                  if (trip.routeCoordinates && trip.routeCoordinates.length > 0) {
                    let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
                    for (const [lat, lng] of trip.routeCoordinates) {
                      if (lat < minLat) minLat = lat;
                      if (lat > maxLat) maxLat = lat;
                      if (lng < minLng) minLng = lng;
                      if (lng > maxLng) maxLng = lng;
                    }
                    setTargetView({
                      bounds: {
                        southWest: { lat: minLat, lng: minLng },
                        northEast: { lat: maxLat, lng: maxLng },
                      },
                      timestamp: Date.now(),
                    });
                  }
                  if (currentView !== 'explore' && currentView !== 'home') {
                    handleNav('explore');
                  }
                }}
                onClearTripRoute={() => {
                  setSearchFilters((prev) => ({
                    ...prev,
                    tripRoute: null,
                  }));
                }}
              />
            </div>

            {/* Right: Actions & User Pill */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              {/* Live Map & Routes Quick Launch */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleNav('explore')}
                className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-dark-900/90 hover:bg-black text-white text-xs font-extrabold shadow-xs transition-all"
              >
                <Compass className="w-3.5 h-3.5 text-roo-400" />
                <span>Live Map</span>
              </motion.button>

              {/* Mission & Vision Link */}
              <button
                onClick={() => handleNav('about')}
                className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold transition-all ${
                  currentView === 'about'
                    ? 'bg-roo-50 text-roo-700 border border-roo-200'
                    : 'text-dark-700 hover:text-dark-950 hover:bg-dark-100/80'
                }`}
                title="Our Mission & Story"
              >
                <span>Mission</span>
              </button>

              {/* Host Spot Button - desktop / tablet only, mobile has it in bottom nav */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleNav('host-onboarding')}
                className="hidden sm:flex items-center gap-1.5 rounded-full text-xs font-extrabold border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 shadow-2xs transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Share a spot</span>
              </Button>

              {/* Sign In Trigger (defaults to signin mode) - ONLY when NOT authenticated */}
              {!isAuthenticated && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAuthMode('signin');
                    setAuthModalOpen(true);
                  }}
                  className="hidden sm:flex rounded-full text-xs font-bold gap-1.5 border-dark-300 hover:border-dark-400"
                >
                  <Sparkles className="w-3.5 h-3.5 text-roo-500" />
                  <span>Sign In</span>
                </Button>
              )}

              {/* Admin Traffic Shortcut - ONLY shown when authenticated as Admin Aziz */}
              {isUserAdmin && (
                <button
                  onClick={() => setAnalyticsModalOpen(true)}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition-colors shadow-2xs"
                  title="Traffic & Data Hub (Admin Aziz)"
                >
                  <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Traffic & Data</span>
                </button>
              )}

              {/* Safety Center Shortcut */}
              <button
                onClick={() => handleNav('safety')}
                className="hidden sm:flex p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Trust & Safety Center"
              >
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </button>

              {/* Buy Me a Coffee button (desktop/tablet only; mobile has it directly in bottom nav) */}
              <a
                href="https://buymeacoffee.com/camproo"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-black shadow-2xs transition-all active:scale-95 shrink-0"
                title="☕ Buy Me a Coffee"
              >
                <span>☕</span>
                <span className="hidden xs:inline">Coffee</span>
              </a>

              {/* User Dropdown Pill */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 pl-3 pr-1.5 py-1.5 rounded-full border border-dark-200 hover:shadow-md bg-white transition-all shadow-2xs"
                >
                  <Menu className="w-4 h-4 text-dark-600" />
                  <div className="relative">
                    {isAuthenticated ? (
                      <Avatar className="w-7 h-7 ring-1 ring-dark-200">
                        <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                        <AvatarFallback className="bg-emerald-600 text-white font-bold text-xs">
                          {currentUser.name.slice(0, 1).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-dark-100 flex items-center justify-center text-dark-600">
                        <UserIcon className="w-4 h-4" />
                      </div>
                    )}
                    {isAuthenticated && (pendingRequestsForHost > 0 || unreadMessagesCount > 0) && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-roo-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                </motion.button>

                {/* Dropdown Menu - Cleaned up: only Share a spot and Log out */}
                <AnimatePresence>
                  {userDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-[590]"
                        onClick={() => setUserDropdownOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-64 bg-white rounded-3xl shadow-2xl border border-dark-200 p-2 z-[600] divide-y divide-dark-100"
                        onMouseLeave={() => setUserDropdownOpen(false)}
                      >
                      {/* User Info Header when signed in */}
                      {isAuthenticated && (
                        <div className="px-3.5 py-2.5 mb-1 bg-dark-50/70 rounded-2xl">
                          <div className="flex items-center gap-2.5">
                            <Avatar className="w-8 h-8 ring-1 ring-dark-200">
                              <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                              <AvatarFallback className="bg-emerald-600 text-white font-bold text-xs">
                                {currentUser.name.slice(0, 1).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <p className="text-xs font-bold text-dark-900 truncate">{currentUser.name}</p>
                                {isUserAdmin && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-amber-100 text-amber-800">Admin</span>
                                )}
                              </div>
                              <p className="text-[11px] text-dark-500 truncate">{currentUser.email || 'Camper'}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Primary Action: Share a Spot */}
                      <div className="py-1">
                        <button
                          onClick={() => {
                            handleNav('host-onboarding');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-emerald-50 text-emerald-950 font-bold flex items-center justify-between text-xs transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-emerald-600" />
                            <span>Share a spot</span>
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold">
                            FREE
                          </span>
                        </button>

                        {/* Admin Hub shortcut */}
                        {isUserAdmin ? (
                          <>
                            <button
                              onClick={() => {
                                handleNav('admin');
                                setUserDropdownOpen(false);
                              }}
                              className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold text-amber-800 hover:bg-amber-50 flex items-center justify-between transition-colors mt-0.5"
                            >
                              <span className="flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-amber-600" />
                                <span>Ranger Admin Hub</span>
                              </span>
                            </button>
                            <button
                              onClick={() => {
                                setAnalyticsModalOpen(true);
                                setUserDropdownOpen(false);
                              }}
                              className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold text-emerald-800 hover:bg-emerald-50 flex items-center justify-between transition-colors mt-0.5"
                            >
                              <span className="flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-emerald-600" />
                                <span>Traffic & Data</span>
                              </span>
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              handleNav('admin');
                              setUserDropdownOpen(false);
                            }}
                            className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold text-dark-700 hover:bg-dark-50 flex items-center justify-between transition-colors mt-0.5"
                          >
                            <span className="flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4 text-amber-600" />
                              <span>Ranger Admin Portal</span>
                            </span>
                          </button>
                        )}

                        {/* Our Mission & Story */}
                        <button
                          onClick={() => {
                            handleNav('about');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold text-dark-800 hover:bg-dark-50 flex items-center justify-between transition-colors mt-0.5"
                        >
                          <span className="flex items-center gap-2">
                            <Compass className="w-4 h-4 text-roo-500" />
                            <span>Our Mission & Story</span>
                          </span>
                        </button>
                      </div>

                      {/* Log Out (or Sign In if not logged in) */}
                      <div className="pt-1">
                        {isAuthenticated ? (
                          <button
                            onClick={() => {
                              logout();
                              setUserDropdownOpen(false);
                            }}
                            className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center justify-between transition-colors"
                          >
                            <span className="flex items-center gap-2">
                              <LogOut className="w-4 h-4 text-rose-500" />
                              <span>Log Out</span>
                            </span>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setAuthMode('signin');
                              setAuthModalOpen(true);
                              setUserDropdownOpen(false);
                            }}
                            className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold text-roo-600 hover:bg-roo-50 flex items-center justify-between transition-colors"
                          >
                            <span className="flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-roo-500" />
                              <span>Sign In</span>
                            </span>
                          </button>
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authMode}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* Traffic & Email Analytics Hub Modal */}
      <TrafficAnalyticsModal
        isOpen={analyticsModalOpen}
        onClose={() => setAnalyticsModalOpen(false)}
      />
    </>
  );
};
