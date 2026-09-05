import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { SpotCard } from '../explore/SpotCard';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ArrowRight, Sparkles, Star } from 'lucide-react';

export const FeaturedSpots: React.FC = () => {
  const { spots, users, setSelectedSpotId, setCurrentView } = useApp();
  const [hoveredSpotId, setHoveredSpotId] = useState<string | null>(null);
  const [vsotd, setVsotd] = useState<any>(null);

  useEffect(() => {
    fetch('/api/vsotd')
      .then(res => res.json())
      .then(data => {
        if (data?.vsotd) setVsotd(data.vsotd);
      })
      .catch(() => {});
  }, []);

  const featured = spots.filter(s => s.isFeatured).slice(0, 4);

  const handleSelectSpot = (id: string) => {
    setSelectedSpotId(id);
    setCurrentView('spot-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRequestStay = (spot: any) => {
    setSelectedSpotId(spot.id);
    setCurrentView('spot-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleVsotdClick = () => {
    if (!vsotd?.spotId) return;
    fetch('/api/vsotd/track', { method: 'POST' }).catch(() => {});
    handleSelectSpot(vsotd.spotId);
  };

  return (
    <section className="py-20 bg-background text-foreground space-y-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* VSOTD Highlight Banner */}
        {vsotd && (
          <div className="mb-10 p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-roo-500/10 to-emerald-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-2xl shadow-md shrink-0">
                ⭐
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black uppercase tracking-wider mb-1 border border-amber-300">
                  <Star className="w-3 h-3 text-amber-600 fill-amber-600" />
                  Ranger Choice: Vehicle & Spot Of The Day (VSOTD)
                </div>
                <h3 className="text-xl font-extrabold text-foreground">{vsotd.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{vsotd.locationName} · <span className="text-amber-700 italic font-medium">"{vsotd.highlightNote}"</span></p>
              </div>
            </div>
            <Button
              onClick={handleVsotdClick}
              className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition-all shrink-0"
            >
              Explore VSOTD Spot →
            </Button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <Badge variant="sage" className="mb-2 gap-1.5 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              COMMUNITY FAVORITES
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              Featured CampRoo Spots
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Top-rated peer-to-peer stays hosted by long-time RV roamers.
            </p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setCurrentView('explore');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="inline-flex items-center gap-2 text-xs font-bold hover:text-primary transition-colors"
          >
            <span>View all 9,700+ free spots</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featured.map(spot => {
            const host = users.find(u => u.id === spot.hostId);
            return (
              <SpotCard
                key={spot.id}
                spot={spot}
                host={host}
                isHovered={hoveredSpotId === spot.id}
                onHover={setHoveredSpotId}
                onSelect={handleSelectSpot}
                onRequest={handleRequestStay}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
};
