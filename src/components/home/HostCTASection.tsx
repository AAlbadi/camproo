import React from 'react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { PlusCircle, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';

export const HostCTASection: React.FC = () => {
  const { setCurrentView } = useApp();

  return (
    <section className="py-20 bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-4xl bg-dark-900 overflow-hidden text-white p-8 sm:p-14 lg:p-20 shadow-2xl">
          {/* Background image overlay */}
          <img
            src="/images/real_bald_mountain.jpg"
            alt="CampRoo host acreage"
            className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />

          <div className="relative z-10 max-w-2xl space-y-6">
            <Badge variant="outdoor" className="gap-2 uppercase tracking-wider font-bold">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              JOIN THE HOST NETWORK
            </Badge>

            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              Have a place to park an RV? <br />
              <span className="text-roo-400">Share your spot</span> with another RVer.
            </h2>

            <p className="text-sm sm:text-base text-dark-300 leading-relaxed font-normal">
              Whether you have a peaceful gravel driveway, a corner of your farm, desert acreage, or a ranch meadow — welcome traveling rovers on their journey.
              You control availability, accepted rig sizes, and house rules. 100% free peer hospitality.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Button
                variant="outdoor"
                size="lg"
                onClick={() => {
                  setCurrentView('host-onboarding');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Become a CampRoo Host</span>
              </Button>

              <Button
                variant="glassDark"
                size="lg"
                onClick={() => {
                  setCurrentView('safety');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex items-center gap-2 text-xs"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Host Protection & Safety</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
