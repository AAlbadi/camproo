import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SpotCard } from '../explore/SpotCard';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';

export const FeaturedSpots: React.FC = () => {
  const { spots, users, setSelectedSpotId, setCurrentView } = useApp();
  const [hoveredSpotId, setHoveredSpotId] = useState<string | null>(null);

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

  return (
    <section className="py-20 bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
