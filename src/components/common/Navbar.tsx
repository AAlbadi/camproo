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
  BarChart3
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    currentUser,
    users,
    switchUser,
    currentView,
    setCurrentView,
    requests,
    threads,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [analyticsModalOpen, setAnalyticsModalOpen] = useState(false);

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
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-dark-200 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Left: CampRoo Brand Mark */}
            <div
              onClick={() => handleNav('home')}
              className="cursor-pointer transition-transform hover:scale-[1.01] shrink-0"
            >
              <MascotBadge size="md" tagline="WHERE RVERS HELP RVERS" />
            </div>

            {/* Center: Airbnb-style Compact Search Pill & Explore Button */}
            <div className="hidden md:flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleNav('explore')}
                className="flex items-center gap-3 pl-5 pr-2 py-2 rounded-full border border-dark-300 hover:shadow-search bg-white text-xs font-semibold text-dark-900 transition-all shadow-xs"
              >
                <span className="font-bold text-dark-900">Explore 9,700+ Spots</span>
                <span className="text-dark-300">|</span>
                <span className="text-dark-700">Any Rig</span>
                <span className="text-dark-300">|</span>
                <span className="text-dark-500 font-normal">100% Free</span>
                <div className="w-8 h-8 rounded-full bg-roo-500 text-white flex items-center justify-center shrink-0">
                  <Search className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
              </motion.button>
            </div>

            {/* Right: Actions & User Pill */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Host Spot Button with shadcn Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleNav('host-onboarding')}
                className="hidden lg:flex rounded-full text-xs font-bold"
              >
                Share your spot
              </Button>

              {/* Sign In Quick Trigger */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setAuthMode('signup');
                  setAuthModalOpen(true);
                }}
                className="hidden sm:flex rounded-full text-xs font-bold gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>Sign In</span>
              </Button>

              {/* Traffic & Data Hub Shortcut */}
              <button
                onClick={() => setAnalyticsModalOpen(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition-colors shadow-2xs"
                title="Traffic, Newsletter & Data Hub"
              >
                <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Traffic & Data</span>
              </button>

              {/* Safety Center Shortcut */}
              <button
                onClick={() => handleNav('safety')}
                className="hidden sm:flex p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Trust & Safety Center"
              >
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </button>

              {/* User Dropdown Pill with shadcn Avatar & Badge */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 pl-3 pr-1.5 py-1.5 rounded-full border border-border hover:shadow-md bg-card transition-all"
                >
                  <Menu className="w-4 h-4 text-muted-foreground" />
                  <div className="relative">
                    <Avatar className="w-7 h-7 ring-1 ring-border">
                      <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                      <AvatarFallback>{currentUser.name.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    {(pendingRequestsForHost > 0 || unreadMessagesCount > 0) && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full border-2 border-background" />
                    )}
                  </div>
                </motion.button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {userDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-72 bg-white rounded-3xl shadow-airbnb-hover border border-dark-200 p-2 z-50 divide-y divide-dark-100"
                      onMouseLeave={() => setUserDropdownOpen(false)}
                    >
                      {/* Nav Links */}
                      <div className="py-1 text-xs font-semibold text-dark-800">
                        <button
                          onClick={() => { handleNav('explore'); setUserDropdownOpen(false); }}
                          className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-dark-50 flex items-center justify-between"
                        >
                          <span>Explore Free Spots</span>
                          <Compass className="w-4 h-4 text-dark-500" />
                        </button>
                        <button
                          onClick={() => { handleNav('trips'); setUserDropdownOpen(false); }}
                          className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-dark-50 flex items-center justify-between"
                        >
                          <span>My Roaming Trips</span>
                          <Car className="w-4 h-4 text-dark-500" />
                        </button>
                        <button
                          onClick={() => { handleNav('my-spots'); setUserDropdownOpen(false); }}
                          className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-dark-50 flex items-center justify-between"
                        >
                          <span className="flex items-center gap-1.5">
                            <span>My Shared Spots</span>
                            {pendingRequestsForHost > 0 && (
                              <span className="px-1.5 py-0.2 bg-roo-500 text-white rounded-full text-[10px]">
                                {pendingRequestsForHost}
                              </span>
                            )}
                          </span>
                          <Home className="w-4 h-4 text-dark-500" />
                        </button>
                        <button
                          onClick={() => { handleNav('messages'); setUserDropdownOpen(false); }}
                          className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-dark-50 flex items-center justify-between"
                        >
                          <span>Messages</span>
                          <MessageSquare className="w-4 h-4 text-dark-500" />
                        </button>
                        <button
                          onClick={() => { handleNav('community'); setUserDropdownOpen(false); }}
                          className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-dark-50 flex items-center justify-between"
                        >
                          <span>The Roam Hub (Community)</span>
                          <Users className="w-4 h-4 text-dark-500" />
                        </button>
                      </div>

                      {/* Profile & Admin */}
                      <div className="py-1.5 px-1">
                        <button
                          onClick={() => { handleNav('profile'); setUserDropdownOpen(false); }}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-dark-900 hover:bg-dark-50"
                        >
                          Profile & Rig Details
                        </button>
                        <button
                          onClick={() => { handleNav('admin'); setUserDropdownOpen(false); }}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-roo-600 hover:bg-roo-50 flex items-center justify-between"
                        >
                          <span>Ranger Admin Moderation</span>
                          <ShieldAlert className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
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
