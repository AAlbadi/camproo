import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LeaveReviewModal } from './LeaveReviewModal';
import { StayRequest, Spot } from '../../types';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { Separator } from '../ui/separator';
import {
  Car,
  MapPin,
  Calendar,
  Clock,
  MessageSquare,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  Star,
  Compass,
  ArrowRight
} from 'lucide-react';

export const MyTripsPage: React.FC = () => {
  const {
    currentUser,
    requests,
    spots,
    users,
    reviews,
    setCurrentView,
    setSelectedSpotId,
    setActiveThreadId,
    threads,
  } = useApp();

  const [activeTab, setActiveTab] = useState<string>('upcoming');
  const [reviewingRequest, setReviewingRequest] = useState<StayRequest | null>(null);

  // Filter requests for current traveler
  const myRequests = requests.filter(r => r.travelerId === currentUser.id);

  const upcoming = myRequests.filter(r => r.status === 'accepted' || r.status === 'pending');
  const past = myRequests.filter(r => r.status === 'completed' || r.status === 'declined');

  const currentList = activeTab === 'upcoming' ? upcoming : past;

  const handleOpenChat = (req: StayRequest) => {
    const thread = threads.find(
      t => t.stayRequestId === req.id || (t.participants.includes(req.travelerId) && t.participants.includes(req.hostId))
    );
    if (thread) {
      setActiveThreadId(thread.id);
      setCurrentView('messages');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in text-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">My Roaming Trips</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Track your free peer-to-peer RV stays and access directions.
          </p>
        </div>

        {/* Tab Switcher */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
          <TabsList className="bg-secondary/60">
            <TabsTrigger value="upcoming">
              Upcoming Stays ({upcoming.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past Stays ({past.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Trips List */}
      <div className="space-y-4">
        {currentList.length === 0 ? (
          <Card className="p-12 text-center border-border shadow-soft space-y-4">
            <div className="w-14 h-14 rounded-full bg-secondary mx-auto flex items-center justify-center text-primary text-2xl">
              🚐
            </div>
            <h3 className="text-lg font-bold text-foreground">
              No {activeTab} stays yet
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
              Discover peaceful driveways, farms, and desert spots shared by fellow RV travelers.
            </p>
            <Button
              onClick={() => {
                setCurrentView('explore');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              variant="outdoor"
              size="default"
              className="mx-auto"
            >
              Explore Free Spots
            </Button>
          </Card>
        ) : (
          currentList.map(req => {
            const spot = spots.find(s => s.id === req.spotId);
            const host = users.find(u => u.id === req.hostId);
            const hasReviewed = reviews.some(r => r.stayRequestId === req.id);

            return (
              <Card
                key={req.id}
                className="p-6 border-border bg-card shadow-soft hover:shadow-float transition-all space-y-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-border">
                  <div className="flex items-start gap-4">
                    {spot && (
                      <img
                        src={spot.photos[0]}
                        alt={spot.title}
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => {
                          setSelectedSpotId(spot.id);
                          setCurrentView('spot-detail');
                        }}
                      />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            req.status === 'accepted'
                              ? 'sage'
                              : req.status === 'pending'
                              ? 'outline'
                              : req.status === 'completed'
                              ? 'secondary'
                              : 'destructive'
                          }
                          className="font-bold"
                        >
                          {req.status === 'accepted' ? '✓ Stay Confirmed' : req.status}
                        </Badge>
                        <Badge variant="free">100% FREE</Badge>
                      </div>

                      <h3
                        onClick={() => {
                          if (spot) {
                            setSelectedSpotId(spot.id);
                            setCurrentView('spot-detail');
                          }
                        }}
                        className="text-lg font-extrabold text-foreground hover:text-primary transition-colors mt-1 cursor-pointer"
                      >
                        {spot?.title || 'RV Spot'}
                      </h3>

                      <p className="text-xs text-muted-foreground font-medium">
                        {spot?.locationName}, {spot?.generalArea}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-start">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenChat(req)}
                      className="flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-primary" />
                      <span>Host Chat</span>
                    </Button>
                    {req.status === 'completed' && !hasReviewed && (
                      <Button
                        variant="outdoor"
                        size="sm"
                        onClick={() => setReviewingRequest(req)}
                        className="flex items-center gap-1.5"
                      >
                        <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                        <span>Leave Review</span>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Stay Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-foreground/80">
                  <div className="p-3 rounded-xl bg-secondary/40 border border-border">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Dates</span>
                    <span className="font-extrabold text-foreground mt-0.5 block">
                      {req.arrivalDate} → {req.departureDate}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{req.nights} night{req.nights > 1 ? 's' : ''}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-secondary/40 border border-border">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Your Rig</span>
                    <span className="font-extrabold text-foreground mt-0.5 block">
                      {req.travelerRig.lengthFt} ft
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate block">{req.travelerRig.description}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-secondary/40 border border-border">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Host Contact</span>
                    <span className="font-extrabold text-foreground mt-0.5 block">{host?.name}</span>
                    <span className="text-[10px] text-muted-foreground">{host?.phone}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-secondary/40 border border-border">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Estimated Arrival</span>
                    <span className="font-extrabold text-foreground mt-0.5 block">{req.arrivalTimeEst || '4:00 PM'}</span>
                    <span className="text-[10px] text-muted-foreground">Coordinated with host</span>
                  </div>
                </div>

                {/* Secret Arrival Directions (Unlocked on Confirmation) */}
                {req.status === 'accepted' && spot?.exactAddressSecret && (
                  <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-950 dark:text-emerald-100 space-y-2">
                    <div className="font-bold flex items-center gap-1.5 text-emerald-900 dark:text-emerald-200">
                      <Unlock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Unlocked Host Directions & Gate Code</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <strong>Exact Street Address:</strong> {spot.exactAddressSecret}
                      </div>
                      <div>
                        <strong>Gate Code / Arrival Info:</strong> {spot.arrivalGateCodeSecret}
                      </div>
                    </div>
                    {req.hostResponseNote && (
                      <p className="italic text-[11px] text-emerald-900/80 dark:text-emerald-300 pt-1 border-t border-emerald-200/60 dark:border-emerald-800/60">
                        Host note: "{req.hostResponseNote}"
                      </p>
                    )}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Review Modal */}
      {reviewingRequest && (
        <LeaveReviewModal
          request={reviewingRequest}
          spot={spots.find(s => s.id === reviewingRequest.spotId)}
          onClose={() => setReviewingRequest(null)}
        />
      )}
    </div>
  );
};
