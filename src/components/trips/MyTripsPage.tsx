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
  ArrowRight,
  Heart,
  Navigation,
  Sparkles
} from 'lucide-react';
import { getOptimizedImageUrl } from '../../lib/imageOptimizer';

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
    savedSpotIds,
    toggleSaveSpot,
    isAuthenticated,
  } = useApp();

  const [activeTab, setActiveTab] = useState<string>('liked');
  const [reviewingRequest, setReviewingRequest] = useState<StayRequest | null>(null);

  // Filter saved/liked spots
  const likedSpots = spots.filter(s => savedSpotIds.includes(s.id));

  // Filter stay requests for current traveler
  const myRequests = requests.filter(r => r.travelerId === currentUser.id);
  const upcoming = myRequests.filter(r => r.status === 'accepted' || r.status === 'pending');
  const past = myRequests.filter(r => r.status === 'completed' || r.status === 'declined');

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
    <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 animate-fade-in text-foreground">
      {/* Guest Notice Banner */}
      {!isAuthenticated && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">✨</span>
            <p className="text-xs text-amber-950 font-medium leading-relaxed">
              <strong className="font-bold">Browsing as Guest:</strong> Your liked spots are temporarily saved on this device. Sign in to permanently sync your havens and travel requests.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setCurrentView('profile');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="rounded-xl border-amber-300 bg-white hover:bg-amber-100 text-amber-900 text-xs font-bold shrink-0 self-start sm:self-auto"
          >
            Sign In / Join Free →
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="sage" className="uppercase tracking-wider text-[10px] font-black">
              RVer Travel Plans
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            My Liked Spots & Trips
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Your saved free boondocking havens and direct GPS navigation.
          </p>
        </div>

        {/* Tab Switcher */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
          <TabsList className="bg-secondary/60">
            <TabsTrigger value="liked" className="flex items-center gap-1.5 font-bold">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>Liked ({likedSpots.length})</span>
            </TabsTrigger>
            <TabsTrigger value="upcoming">
              Stays ({upcoming.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past ({past.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* TAB 1: LIKED / SAVED SPOTS */}
      {activeTab === 'liked' && (
        <div className="space-y-4">
          {likedSpots.length === 0 ? (
            <Card className="p-8 sm:p-12 text-center border-border shadow-soft space-y-4 rounded-3xl">
              <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-200 mx-auto flex items-center justify-center text-rose-500 text-2xl">
                ❤️
              </div>
              <h3 className="text-lg font-bold text-foreground">
                No liked spots saved yet
              </h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                Browse our map of 9,780+ free public land campsites and private driveways, and tap the heart icon on any spot to save it here!
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {likedSpots.map(spot => (
                <Card
                  key={spot.id}
                  className="p-3.5 rounded-3xl border-border bg-card shadow-soft hover:shadow-float transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Photo with 1-tap unlike heart */}
                    <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-dark-200 mb-3">
                      <img
                        src={getOptimizedImageUrl(spot.photos[0], { width: 480, quality: 75 })}
                        alt={spot.title}
                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                        onClick={() => {
                          setSelectedSpotId(spot.id);
                          setCurrentView('spot-detail');
                        }}
                      />
                      <div className="absolute top-2 left-2 flex gap-1 items-center">
                        <Badge variant="free" className="text-[9px] shadow-xs">
                          100% FREE
                        </Badge>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSaveSpot(spot.id);
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 backdrop-blur-md hover:bg-white text-rose-500 shadow-xs transition-transform active:scale-90"
                        title="Remove from Liked Spots"
                      >
                        <Heart className="w-4 h-4 fill-rose-500" />
                      </button>
                    </div>

                    {/* Spot Title & Info */}
                    <h3
                      onClick={() => {
                        setSelectedSpotId(spot.id);
                        setCurrentView('spot-detail');
                      }}
                      className="text-sm font-extrabold text-foreground hover:text-primary transition-colors cursor-pointer truncate"
                    >
                      {spot.title}
                    </h3>
                    <p className="text-xs text-muted-foreground font-medium truncate mt-0.5">
                      {spot.locationName}, {spot.generalArea}
                    </p>

                    <div className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground mt-2">
                      {spot.rating > 0 && spot.reviewCount > 0 ? (
                        <span className="text-amber-500 font-bold">★ {spot.rating}</span>
                      ) : (
                        <span className="text-emerald-700 font-bold">Free Spot</span>
                      )}
                      <span>·</span>
                      <span className="text-emerald-700 font-bold">Max {spot.rigCompatibility.maxLengthFt}ft</span>
                      <span>·</span>
                      <span className="capitalize">{spot.environment}</span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-2 pt-3 mt-3 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedSpotId(spot.id);
                        setCurrentView('spot-detail');
                      }}
                      className="flex-1 text-xs font-bold"
                    >
                      Details →
                    </Button>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${spot.coordinates[0]},${spot.coordinates[1]}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200/80 transition-colors shadow-2xs"
                    >
                      <Navigation className="w-3 h-3 text-blue-600" />
                      <span>GPS Nav ↗</span>
                    </a>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2 & 3: BOOKED STAYS */}
      {activeTab !== 'liked' && (
      <div className="space-y-4">
        {(activeTab === 'upcoming' ? upcoming : past).length === 0 ? (
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
          (activeTab === 'upcoming' ? upcoming : past).map(req => {
            const spot = spots.find(s => s.id === req.spotId);
            const host = users.find(u => u.id === req.hostId);
            const hasReviewed = reviews.some(r => r.stayRequestId === req.id);

            return (
              <Card
                key={req.id}
                className="p-4 sm:p-6 border-border bg-card shadow-soft hover:shadow-float transition-all space-y-4 sm:space-y-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-border">
                  <div className="flex items-start gap-3 sm:gap-4">
                    {spot && (
                      <img
                        src={spot.photos[0]}
                        alt={spot.title}
                        className="w-18 h-18 sm:w-24 sm:h-24 rounded-2xl object-cover shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
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
                        className="text-base sm:text-lg font-extrabold text-foreground hover:text-primary transition-colors mt-1 cursor-pointer"
                      >
                        {spot?.title || 'RV Spot'}
                      </h3>

                      <p className="text-xs text-muted-foreground font-medium">
                        {spot?.locationName}, {spot?.generalArea}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end sm:justify-start">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenChat(req)}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-primary" />
                      <span>Host Chat</span>
                    </Button>
                    {req.status === 'completed' && !hasReviewed && (
                      <Button
                        variant="outdoor"
                        size="sm"
                        onClick={() => setReviewingRequest(req)}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5"
                      >
                        <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                        <span>Leave Review</span>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Stay Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-xs text-foreground/80">
                  <div className="p-2.5 sm:p-3 rounded-xl bg-secondary/40 border border-border">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Dates</span>
                    <span className="font-extrabold text-foreground mt-0.5 block">
                      {req.arrivalDate} → {req.departureDate}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{req.nights} night{req.nights > 1 ? 's' : ''}</span>
                  </div>

                  <div className="p-2.5 sm:p-3 rounded-xl bg-secondary/40 border border-border">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Your Rig</span>
                    <span className="font-extrabold text-foreground mt-0.5 block">
                      {req.travelerRig.lengthFt} ft
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate block">{req.travelerRig.description}</span>
                  </div>

                  <div className="p-2.5 sm:p-3 rounded-xl bg-secondary/40 border border-border">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Host Contact</span>
                    <span className="font-extrabold text-foreground mt-0.5 block truncate">{host?.name}</span>
                    <span className="text-[10px] text-muted-foreground">{host?.phone}</span>
                  </div>

                  <div className="p-2.5 sm:p-3 rounded-xl bg-secondary/40 border border-border">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Estimated Arrival</span>
                    <span className="font-extrabold text-foreground mt-0.5 block">{req.arrivalTimeEst || '4:00 PM'}</span>
                    <span className="text-[10px] text-muted-foreground">Coordinated with host</span>
                  </div>
                </div>

                {/* Secret Arrival Directions (Unlocked on Confirmation) */}
                {req.status === 'accepted' && spot?.exactAddressSecret && (
                  <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-950 dark:text-emerald-100 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-bold flex items-center gap-1.5 text-emerald-900 dark:text-emerald-200">
                        <Unlock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>Unlocked Host Directions & Gate Code</span>
                      </div>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(spot.exactAddressSecret || `${spot.coordinates[0]},${spot.coordinates[1]}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-2xs transition-colors shrink-0"
                      >
                        <span>GPS Nav ↗</span>
                      </a>
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
      )}

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
