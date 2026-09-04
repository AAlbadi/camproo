import React from 'react';
import { Search, Send, Compass, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';

export const HowItWorks: React.FC = () => {
  const { setCurrentView } = useApp();

  const steps = [
    {
      num: '01',
      title: 'Find a Spot',
      desc: 'Discover free RV-friendly spaces shared by fellow RVers — driveways, farms, desert pads, and private acreage.',
      icon: Search,
      badge: 'Filter by Rig Length & 50A Power',
    },
    {
      num: '02',
      title: 'Request a Stay',
      desc: 'Tell the host about your trip, your vehicle class, and arrival time. No credit card or booking fees required.',
      icon: Send,
      badge: 'Direct Peer-to-Peer Message',
    },
    {
      num: '03',
      title: 'Meet & Roam',
      desc: 'Unlock exact gate directions, connect with your host, swap road stories around the fire, and keep roaming.',
      icon: Compass,
      badge: 'Hospitality & Reciprocal Reviews',
    },
  ];

  return (
    <section id="how-it-works-section" className="py-20 bg-secondary/30 border-y border-border scroll-mt-24 text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <Badge variant="sage" className="uppercase tracking-widest font-black">
            SIMPLE · TRUSTED · FREE
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            How CampRoo Works
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            We are not a commercial booking platform. We are a community of real travelers opening our gates to help one another on the open road.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <Card
                key={idx}
                className="relative p-8 border-border bg-card shadow-soft hover:shadow-float hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                {/* Step number badge */}
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-primary font-bold">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-3xl font-extrabold text-muted-foreground/30 font-mono">
                    {step.num}
                  </span>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-foreground">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed font-normal">
                    {step.desc}
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-border">
                  <Badge variant="sage" className="text-[11px] font-bold">
                    ✓ {step.badge}
                  </Badge>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
