import React from 'react';
import { DollarSign, HeartHandshake, MapPin, Gauge, ShieldCheck, Coffee, Heart, Caravan, Sparkles } from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';

export const WhyRVersChooseUs: React.FC = () => {
  // Official CampRoo Brand Pillars from brand identity
  const brandPillars = [
    {
      badge: 'FRIENDLY & FUN',
      title: 'Cool & Laid-Back',
      desc: 'Our Roo is cool, laid-back and always ready for the next adventure on the open road.',
      image: '/images/camproo_app_icon.jpg',
    },
    {
      badge: 'MADE FOR RV LOVERS',
      title: 'Built by RVers, for RVers',
      desc: "It's not just a logo, it's our lifestyle. Pad clearance, amp ratings, and leveling tips dialed in.",
      icon: Caravan,
      color: 'bg-orange-50 text-roo-500 border-roo-200',
    },
    {
      badge: 'COMMUNITY FIRST',
      title: 'Helping RVers Connect',
      desc: 'Helping RVers connect, share spare space, and look out for each other with zero booking fees.',
      icon: MapPin,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    },
    {
      badge: 'SHARE THE ROAD',
      title: 'Roam Together',
      desc: 'Because the best memories happen when we roam together across America’s scenic byways.',
      icon: Heart,
      color: 'bg-amber-50 text-amber-600 border-amber-200',
    },
  ];

  const reasons = [
    {
      icon: DollarSign,
      title: '100% Free Stays',
      desc: 'No hidden booking fees, site surcharges, or peak holiday markups. Just genuine peer hospitality.',
    },
    {
      icon: HeartHandshake,
      title: 'Real RV Community',
      desc: 'Connect with hosts who actually own rigs, know how 30A breakers work, and love sharing route advice.',
    },
    {
      icon: MapPin,
      title: 'Unique Locations',
      desc: 'Park in desert date groves, Oregon organic berry farms, Sedona juniper ridges, and Maine coastal harbors.',
    },
    {
      icon: Gauge,
      title: 'Know Before You Arrive',
      desc: 'Exact clearance height, pad levelness, pull-through radius, and plug amperage listed on every spot.',
    },
    {
      icon: ShieldCheck,
      title: 'Trusted Profiles & Reviews',
      desc: 'Verified email, phone, and rig ownership. Both hosts and travelers review each other after every stay.',
    },
    {
      icon: Coffee,
      title: 'People Who Understand RV Life',
      desc: 'Need water top-off or safe tire pressure advice? Your host has lived the roaming journey too.',
    },
  ];

  return (
    <section className="py-20 bg-secondary/20 border-t border-border text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Brand Pillars Highlight Banner */}
        <div className="mb-20 bg-white rounded-3xl p-8 sm:p-10 border border-border shadow-sm">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 pb-8 border-b border-border">
            <div className="space-y-2 text-center lg:text-left">
              <Badge variant="outdoor" className="font-black uppercase tracking-wider">
                OUR CORE PROMISE
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                The Four CampRoo Pillars
              </h2>
              <p className="text-sm text-muted-foreground max-w-xl">
                Find a spot. Share a spot. Keep roaming. How our peer-to-peer network stays trusted and 100% free.
              </p>
            </div>
            <img
              src="/images/camproo_badge.jpg"
              alt="CampRoo Keep Roaming Official Emblem"
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover shadow-md border-2 border-roo-200 shrink-0"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-8">
            {brandPillars.map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <div key={idx} className="flex flex-col space-y-3">
                  <div className="flex items-center gap-3">
                    {pillar.image ? (
                      <img
                        src={pillar.image}
                        alt="Roo Mascot"
                        className="w-11 h-11 rounded-2xl object-cover shadow-xs border border-roo-200"
                      />
                    ) : (
                      Icon && (
                        <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center ${pillar.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                      )
                    )}
                    <span className="text-[11px] font-black uppercase tracking-wider text-roo-600">
                      {pillar.badge}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-foreground">{pillar.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Why RVers Choose Us Grid */}
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
          <Badge variant="outdoor" className="font-black uppercase tracking-widest">
            THE CAMPROO DIFFERENCE
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Why RVers Choose CampRoo
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed font-normal">
            Built by long-term travelers who got tired of noisy commercial RV parks and overpriced booking engines.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reasons.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Card
                key={idx}
                className="p-7 border-border bg-card shadow-airbnb hover:shadow-airbnb-hover hover:-translate-y-1 transition-all duration-200 space-y-3"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-foreground">{item.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-normal">
                  {item.desc}
                </p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
