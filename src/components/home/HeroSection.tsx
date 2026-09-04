import React from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { TiltCard } from '../common/TiltCard';
import { Button, Badge } from '../ui';
import { Sparkles, ShieldCheck, Compass, Heart, ArrowRight } from 'lucide-react';

export const HeroSection: React.FC = () => {
  const { setCurrentView } = useApp();

  return (
    <section className="relative overflow-hidden pt-8 pb-16 lg:pt-14 lg:pb-24 bg-white">
      {/* Subtle ambient warm glow */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-roo-50/60 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Text & Brand Statement */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 space-y-6"
          >
            {/* Pill Tag with shadcn Badge */}
            <Badge variant="secondary" className="px-3.5 py-1.5 rounded-full text-xs font-bold gap-2 text-secondary-foreground border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              PEER-TO-PEER FREE RV COMMUNITY
            </Badge>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-foreground tracking-tight leading-[1.12]">
              Your next camp could be{' '}
              <span className="text-primary relative inline-block">
                someone's backyard.
                <svg className="absolute -bottom-2 inset-x-0 w-full text-primary/30" viewBox="0 0 200 12" fill="none">
                  <path d="M2 9 C50 2, 150 2, 198 9" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </span>
            </h1>

            {/* Supporting Text */}
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed font-normal">
              CampRoo connects RV travelers with fellow RVers who are opening up their spare space for free.
              No crowded resort fees. Just real hospitality, level pads, and open skies.
            </p>

            {/* CTA Buttons with shadcn Button */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Button
                size="lg"
                onClick={() => {
                  setCurrentView('explore');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="gap-2.5 shadow-lg group text-base font-extrabold"
              >
                <span>Find a Free Spot</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  setCurrentView('host-onboarding');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-base font-bold"
              >
                Share Your Spot
              </Button>
            </div>

            {/* Trust Highlights */}
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-dark-200 max-w-lg">
              <div>
                <div className="text-3xl font-black text-dark-900">100%</div>
                <div className="text-xs font-semibold text-dark-600 mt-0.5">Free Always</div>
              </div>
              <div>
                <div className="text-3xl font-black text-dark-900">9,700+</div>
                <div className="text-xs font-semibold text-dark-600 mt-0.5">Free Spots Nationwide</div>
              </div>
              <div>
                <div className="text-3xl font-black text-dark-900">4.96 ★</div>
                <div className="text-xs font-semibold text-dark-600 mt-0.5">Community Trust</div>
              </div>
            </div>
          </motion.div>

          {/* Right Visual Card with 3D Tilt & Liquid Glass Overlays */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-5 relative"
          >
            <TiltCard maxTilt={10} glareOpacity={0.22}>
              <div className="relative rounded-4xl overflow-hidden shadow-airbnb-hover border border-dark-200 group">
                <img
                  src="/images/hero_rv_camp.jpg"
                  alt="CampRoo red rock campervan spot in Moab Utah"
                  className="w-full h-[460px] sm:h-[500px] object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />

                {/* Floating Roo Mascot Liquid Glass Badge */}
                <div className="absolute top-4 left-4 liquid-glass px-4 py-2.5 rounded-2xl flex items-center gap-3">
                  <img
                    src="/images/camproo_app_icon.jpg"
                    alt="CampRoo Roo Mascot"
                    className="w-9 h-9 rounded-xl object-cover shadow-sm border border-roo-300"
                  />
                  <div>
                    <div className="text-xs font-black text-dark-900">Roo-Verified Space</div>
                    <div className="text-[10px] text-dark-600 font-semibold">Moab Red Rock · 30A Pedestal</div>
                  </div>
                </div>

                {/* Top-right Official Keep Roaming Seal */}
                <div className="absolute top-4 right-4 liquid-glass p-1.5 rounded-full shadow-lg">
                  <img
                    src="/images/camproo_badge.jpg"
                    alt="CampRoo Keep Roaming Badge"
                    className="w-11 h-11 rounded-full object-cover border border-white"
                  />
                </div>

                {/* Bottom Card Liquid Glass Overlay */}
                <div className="absolute bottom-4 left-4 right-4 liquid-glass p-4 rounded-3xl flex items-center justify-between">
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                      100% FREE STAY
                    </span>
                    <h3 className="text-sm font-black text-dark-900 mt-1">Red Rock Roo Oasis</h3>
                    <p className="text-xs text-dark-600 font-medium">Moab, Utah · Caleb & Sarah</p>
                  </div>
                  <button
                    onClick={() => {
                      setCurrentView('explore');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="px-4 py-2 rounded-full bg-roo-500 hover:bg-roo-600 text-white text-xs font-bold transition-colors shadow-sm"
                  >
                    Explore →
                  </button>
                </div>
              </div>
            </TiltCard>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
