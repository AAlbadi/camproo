import React from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import {
  Compass,
  Heart,
  Sparkles,
  Truck,
  Trees,
  DollarSign,
  Coffee,
  Share2,
  Check,
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  const { setCurrentView, isAuthenticated } = useApp();

  const handleNav = (view: string) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pillars = [
    {
      icon: DollarSign,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      title: '100% Free Forever',
      description:
        'No subscription fees, no paywalled coordinates, and no booking cuts. CampRoo is committed to keeping public land and driveway camping accessible to every RVer without corporate paywalls.',
    },
    {
      icon: Truck,
      color: 'bg-roo-50 text-roo-600 border-roo-200',
      title: 'Rig-Tested Clarity & Safety',
      description:
        'Every listing includes verified rig length maximums, turning clearances, road surface difficulty, and real cellular signal tests so you never end up stuck on a narrow mountain washboard.',
    },
    {
      icon: Trees,
      color: 'bg-teal-50 text-teal-600 border-teal-200',
      title: 'Leave No Trace Stewardship',
      description:
        'We are fervent protectors of BLM and USFS public lands. Our community champions strict pack-it-in pack-it-out ethics, campfire vigilance, and preserving pristine wilderness for generations to come.',
    },
    {
      icon: Heart,
      color: 'bg-rose-50 text-rose-500 border-rose-200',
      title: 'Peer-to-Peer Hospitality',
      description:
        'Generous landowners, farmers, and fellow RVers open quiet gravel pads, ranch corners, and driveway hookups for 1 to 3 nights, fostering authentic trust and human connection on the road.',
    },
  ];

  const roamerCode = [
    {
      title: 'Leave It Cleaner Than You Found It',
      text: 'Never leave micro-trash, greywater spills, or abandoned fire debris. If you find trash from prior visitors, pack it out.',
    },
    {
      title: 'Honor Quiet Hours & Private Property',
      text: 'Respect 10 PM to 7 AM quiet times. Keep generators off during quiet hours and treat host properties like sacred ground.',
    },
    {
      title: 'Fire Safety & Wildlife Respect',
      text: 'Never light uncontained ground fires during fire bans. Keep pets leashed to protect local livestock and native wildlife.',
    },
    {
      title: 'Support Small-Town Local Economies',
      text: 'Whenever you boondock nearby, buy your groceries, fuel, and bakery goods from local rural businesses along your route.',
    },
  ];

  return (
    <div className="min-h-screen bg-cream-100/60 text-dark-950 selection:bg-roo-500 selection:text-white pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-8 sm:pt-14 pb-12 sm:pb-20 border-b border-dark-200/60 bg-gradient-to-b from-white via-cream-50 to-cream-100/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center space-y-5 max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-roo-50 border border-roo-200 text-roo-700 text-xs font-black uppercase tracking-wider shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-roo-500" />
              <span>CampRoo Mission & Vision</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-3xl sm:text-5xl lg:text-6xl font-black text-dark-950 tracking-tight leading-[1.15]"
            >
              Where RVers Help RVers{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-roo-600 via-amber-600 to-roo-500">
                Roam Free
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-base sm:text-lg text-dark-600 leading-relaxed max-w-2xl mx-auto font-normal"
            >
              CampRoo was born from a simple belief: exploring America’s breathtaking landscapes shouldn’t cost $100 a night or be locked behind subscription paywalls. We connect road roamers with generous hosts and 9,780+ verified free public land havens.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-wrap items-center justify-center gap-3 pt-2"
            >
              <button
                onClick={() => handleNav('explore')}
                className="px-6 py-3 rounded-2xl bg-roo-500 hover:bg-roo-600 text-white text-xs sm:text-sm font-black shadow-lg shadow-roo-500/25 active:scale-95 transition-all flex items-center gap-2"
              >
                <Compass className="w-4 h-4" />
                <span>Explore Free Havens</span>
              </button>

              <button
                onClick={() => handleNav('host-onboarding')}
                className="px-6 py-3 rounded-2xl bg-white hover:bg-dark-50 border border-dark-300 text-dark-900 text-xs sm:text-sm font-black shadow-xs active:scale-95 transition-all flex items-center gap-2"
              >
                <Share2 className="w-4 h-4 text-emerald-600" />
                <span>Share a Driveway / Spot</span>
              </button>
            </motion.div>
          </div>

          {/* Featured Hero Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mt-10 sm:mt-14 relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white aspect-[16/9] sm:aspect-[21/9] bg-dark-900"
          >
            <img
              src="/images/real_rv_camping_hero.jpg"
              alt="RV Camping Under the Stars"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent flex flex-col justify-end p-5 sm:p-8 text-white">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-full bg-emerald-500/90 text-white text-[11px] font-black uppercase tracking-wider backdrop-blur-md">
                  9,780+ Nationwide Spots
                </span>
                <span className="px-3 py-1 rounded-full bg-white/20 text-white text-[11px] font-bold backdrop-blur-md">
                  BLM · USFS · Private Driveways
                </span>
              </div>
              <h2 className="text-xl sm:text-3xl font-black text-white">
                Authentic Boondocking Across 50 States
              </h2>
              <p className="text-xs sm:text-sm text-cream-200/90 max-w-xl mt-1">
                Real coordinates, verified clearances for Class A, C, Fifth Wheels, and Vans, with zero hidden fees.
              </p>
            </div>
          </motion.div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-6">
            <div className="p-4 rounded-2xl bg-white border border-dark-200 shadow-soft text-center space-y-0.5">
              <div className="text-2xl sm:text-3xl font-black text-dark-950">9,780+</div>
              <div className="text-[11px] sm:text-xs font-bold text-dark-500">Verified Free Spots</div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-dark-200 shadow-soft text-center space-y-0.5">
              <div className="text-2xl sm:text-3xl font-black text-dark-950">50 States</div>
              <div className="text-[11px] sm:text-xs font-bold text-dark-500">Coast to Coast Coverage</div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-dark-200 shadow-soft text-center space-y-0.5">
              <div className="text-2xl sm:text-3xl font-black text-emerald-600">$0</div>
              <div className="text-[11px] sm:text-xs font-bold text-dark-500">Fees or Subscriptions</div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-dark-200 shadow-soft text-center space-y-0.5">
              <div className="text-2xl sm:text-3xl font-black text-roo-600">100%</div>
              <div className="text-[11px] sm:text-xs font-bold text-dark-500">Community Driven</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THE CATALYST: THE PROBLEM VS OUR SOLUTION */}
      <section className="py-12 sm:py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-roo-600 uppercase tracking-wider">
            <span>Why We Built CampRoo</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-dark-950">
            A Better Way to Roam America
          </h2>
          <p className="text-xs sm:text-sm text-dark-500">
            Commercial RVing has become increasingly crowded, commercialized, and costly. We built CampRoo to return the freedom to camping.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Problem Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-red-200 shadow-soft space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-black text-lg shrink-0">
                ✕
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-dark-950">
                  The Old Way: Crowded & Price-Gouged
                </h3>
                <p className="text-xs text-dark-500 font-medium">Commercial RV parks and corporate camping apps</p>
              </div>
            </div>

            <ul className="space-y-3 text-xs sm:text-sm text-dark-600">
              <li className="flex items-start gap-2.5">
                <span className="text-red-500 font-bold shrink-0 mt-0.5">•</span>
                <span><strong>$60 to $130 per night</strong> just for a narrow slab of hot asphalt packed tight next to generators.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-red-500 font-bold shrink-0 mt-0.5">•</span>
                <span><strong>Subscription paywalls</strong> forcing campers to pay $40–$80/year simply to see public land GPS markers.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-red-500 font-bold shrink-0 mt-0.5">•</span>
                <span><strong>Zero verified rig clearances</strong>, leaving travelers stuck under low trees or on steep switchbacks.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-red-500 font-bold shrink-0 mt-0.5">•</span>
                <span><strong>Commercial booking platforms</strong> charging aggressive guest and host service cuts.</span>
              </li>
            </ul>
          </div>

          {/* Solution Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-50/80 via-white to-roo-50/50 border-2 border-emerald-300 shadow-soft space-y-4 relative overflow-hidden">
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-emerald-200/40 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-black text-lg shrink-0 shadow-xs">
                ✓
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-emerald-950">
                  The CampRoo Way: 100% Free & Peer-to-Peer
                </h3>
                <p className="text-xs text-emerald-800 font-semibold">Where RVers Help RVers</p>
              </div>
            </div>

            <ul className="space-y-3 text-xs sm:text-sm text-dark-800">
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 font-bold shrink-0 mt-0.5" />
                <span><strong>100% Free</strong> overnight stays on verified BLM/USFS land and generous private host driveways.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 font-bold shrink-0 mt-0.5" />
                <span><strong>Zero Paywalls & No Ad Tracking</strong>: Open coordinates, offline maps, and coordinates belong to the public.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 font-bold shrink-0 mt-0.5" />
                <span><strong>Verified Rig Profiles</strong>: Precise clearance limits, surface types, pad lengths, and turnarounds.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 font-bold shrink-0 mt-0.5" />
                <span><strong>Direct Host & Roamer Chat</strong>: Warm peer-to-peer hospitality without middleman commissions.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 3. FOUR CORE PILLARS */}
      <section className="py-12 sm:py-16 bg-white border-y border-dark-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-roo-600 uppercase tracking-wider">
              <span>Our Guiding Principles</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-dark-950">
              The Four Pillars of CampRoo
            </h2>
            <p className="text-xs sm:text-sm text-dark-500">
              Every feature we build and every coordinate we curate is guided by these non-negotiable community values.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {pillars.map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={idx}
                  className="p-6 sm:p-7 rounded-3xl bg-cream-50/80 border border-dark-200/90 shadow-soft space-y-3.5 hover:shadow-float transition-all group"
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${pillar.color} shadow-2xs group-hover:scale-105 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-dark-950">
                    {pillar.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-dark-600 leading-relaxed font-normal">
                    {pillar.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. HOW CAMPROO WORKS: TRAVELERS & HOSTS */}
      <section className="py-12 sm:py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-roo-600 uppercase tracking-wider">
            <span>Seamless Coordination</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-dark-950">
            How CampRoo Works
          </h2>
          <p className="text-xs sm:text-sm text-dark-500">
            Whether you are on a cross-country adventure or have extra land to share, CampRoo makes connecting simple and safe.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* For Roamers */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-dark-200 shadow-soft space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-roo-500 text-white flex items-center justify-center font-black">
                🚐
              </div>
              <div>
                <h3 className="text-lg font-black text-dark-950">For Travelers & Roamers</h3>
                <span className="text-xs text-roo-600 font-bold">Discover & Stay Free</span>
              </div>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-roo-100 text-roo-800 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
                <div>
                  <h4 className="font-bold text-dark-950">Search the Live Map</h4>
                  <p className="text-dark-500 text-xs mt-0.5">Filter 9,780+ free spots by rig length, water hookups, state, or BLM land manager.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-roo-100 text-roo-800 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
                <div>
                  <h4 className="font-bold text-dark-950">Check Rig Clearances</h4>
                  <p className="text-dark-500 text-xs mt-0.5">Review maximum vehicle lengths, slope angles, turning radius, and surface firmness.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-roo-100 text-roo-800 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">3</span>
                <div>
                  <h4 className="font-bold text-dark-950">Navigate or Request a Stay</h4>
                  <p className="text-dark-500 text-xs mt-0.5">Open 1-tap Google/Apple GPS navigation to public land, or send a quick message to private driveway hosts.</p>
                </div>
              </div>
            </div>
          </div>

          {/* For Hosts */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-dark-200 shadow-soft space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black">
                🏡
              </div>
              <div>
                <h3 className="text-lg font-black text-dark-950">For Landowners & Hosts</h3>
                <span className="text-xs text-emerald-700 font-bold">Open Your Space Free</span>
              </div>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
                <div>
                  <h4 className="font-bold text-dark-950">List Your Spot in 2 Minutes</h4>
                  <p className="text-dark-500 text-xs mt-0.5">Add your driveway, meadow, or gravel parking pad with simple rules and rig limits.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
                <div>
                  <h4 className="font-bold text-dark-950">Control Your Availability</h4>
                  <p className="text-dark-500 text-xs mt-0.5">You decide how many nights roamers can stay (1-3 nights recommended) and review guests prior to arrival.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">3</span>
                <div>
                  <h4 className="font-bold text-dark-950">Welcome Fellow Roamers</h4>
                  <p className="text-dark-500 text-xs mt-0.5">Exchange stories, build community, and help travelers discover the quiet charm of your home county.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. THE ROAMER'S CODE OF HONOR (STEWARDSHIP) */}
      <section className="py-12 sm:py-16 bg-white border-y border-dark-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto text-xl shadow-2xs">
              📜
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-dark-950">
              The CampRoo Code of the Road
            </h2>
            <p className="text-xs sm:text-sm text-dark-500 max-w-xl mx-auto">
              Our community stays free because we hold each other to the highest standard of wilderness ethics and neighborly respect.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {roamerCode.map((rule, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-dark-50/70 border border-dark-200/80 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-roo-500 text-white text-[10px] font-black flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <h4 className="text-xs font-black text-dark-950">{rule.title}</h4>
                </div>
                <p className="text-[11px] sm:text-xs text-dark-600 leading-relaxed font-normal">
                  {rule.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. SUPPORT OUR MISSION (BUY ME A COFFEE) */}
      <section className="py-12 sm:py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-10 rounded-3xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/50 border-2 border-amber-300 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-lg">
            <div className="flex items-center gap-2">
              <span className="text-2xl">☕</span>
              <h3 className="text-lg sm:text-xl font-black text-amber-950">
                Support CampRoo & Keep It Free
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-amber-900/80 leading-relaxed font-normal">
              CampRoo is a labor of love built for the RV community. We have no venture capital, no subscription paywalls, and no sponsored ad tracking. If we saved you a $100 camping fee, consider fueling the project with a coffee!
            </p>
          </div>

          <a
            href="https://buymeacoffee.com/camproo"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm font-black shadow-lg shadow-amber-500/25 active:scale-95 transition-all text-center shrink-0 flex items-center justify-center gap-2"
          >
            <span>☕ Buy Us a Coffee</span>
          </a>
        </div>
      </section>

      {/* 7. BOTTOM ACTION CTA */}
      <section className="py-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <div className="p-8 sm:p-12 rounded-3xl bg-dark-950 text-white shadow-2xl space-y-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-roo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Ready to Discover America’s Best Free Havens?
            </h2>
            <p className="text-xs sm:text-sm text-dark-300 leading-relaxed">
              Explore 9,780+ tested spots, check verified rig clearances, and join thousands of fellow wanderers roaming free.
            </p>
            <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => handleNav('explore')}
                className="px-6 py-3 rounded-2xl bg-roo-500 hover:bg-roo-600 text-white text-xs sm:text-sm font-black shadow-md active:scale-95 transition-all"
              >
                Launch Interactive Map
              </button>
              <button
                onClick={() => handleNav('profile')}
                className="px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-black border border-white/20 backdrop-blur-sm active:scale-95 transition-all"
              >
                {isAuthenticated ? 'My Roamer Profile' : 'Create Free Account'}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;

