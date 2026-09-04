import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { RigCompatibilityTable } from './RigCompatibilityTable';
import { SpatialRigVisualizer } from './SpatialRigVisualizer';
import { AmenitiesGrid } from './AmenitiesGrid';
import { HostProfileCard } from './HostProfileCard';
import { ReviewsList } from './ReviewsList';
import { RequestStayModal } from './RequestStayModal';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { Separator } from '../ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody } from '../ui/dialog';
import {
  Star,
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  Share2,
  Heart,
  Clock,
  Dog,
  Flame,
  VolumeX,
  Users,
  CalendarCheck,
  Sparkles,
  MapPin,
  Grid,
  Lock,
  CheckCircle2
} from 'lucide-react';

export const SpotDetailPage: React.FC = () => {
  const {
    selectedSpotId,
    spots,
    users,
    reviews,
    currentUser,
    setCurrentView,
    sendMessage,
    submitReport,
  } = useApp();

  const { showToast } = useToast();

  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [reportReason, setReportReason] = useState('Inaccurate description');
  const [reportDetails, setReportDetails] = useState('');

  const spot = spots.find(s => s.id === selectedSpotId) || spots[0];
  const host = users.find(u => u.id === spot.hostId);
  const spotReviews = reviews.filter(r => r.spotId === spot.id);

  const handleMessageHost = () => {
    if (host) {
      sendMessage(null, host.id, `Hi ${host.name}! I am looking at your spot "${spot.title}" and had a quick question.`, spot.id);
      setCurrentView('messages');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitReport({
      reporterId: currentUser.id,
      reportedTargetType: 'spot',
      targetId: spot.id,
      targetName: spot.title,
      reason: reportReason,
      details: reportDetails,
    });
    showToast('Report submitted to CampRoo safety team for review.', 'info');
    setShowReportModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fade-in bg-background text-foreground">
      {/* Top Header: Title, Reviews, Share & Save */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setCurrentView('explore');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="inline-flex items-center gap-2 text-xs font-bold -ml-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Spots</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
                showToast('Spot link copied to clipboard!', 'success');
              }}
              className="flex items-center gap-1.5 text-xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSaved(!isSaved)}
              className="flex items-center gap-1.5 text-xs"
            >
              <Heart className={`w-3.5 h-3.5 ${isSaved ? 'text-primary fill-primary' : ''}`} />
              <span>{isSaved ? 'Saved' : 'Save'}</span>
            </Button>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          {spot.title}
        </h1>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground font-medium pb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1 text-foreground font-bold">
              <Star className="w-3.5 h-3.5 text-foreground fill-foreground" />
              <span>{spot.rating}</span>
              <span className="underline ml-0.5">({spot.reviewCount} stays)</span>
            </span>
            <span>·</span>
            <Badge variant="sage" className="gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Roo Verified Host</span>
            </Badge>
            <span>·</span>
            <span className="underline font-bold text-foreground">
              {spot.locationName}, {spot.generalArea}
            </span>
          </div>

          <button
            onClick={() => setShowReportModal(true)}
            className="text-[11px] text-muted-foreground hover:text-destructive underline transition-colors"
          >
            Report this listing
          </button>
        </div>
      </div>

      {/* Airbnb Signature 5-Photo Grid */}
      <div className="relative rounded-3xl overflow-hidden grid grid-cols-1 md:grid-cols-4 gap-2 aspect-[16/9] md:aspect-[20/9] max-h-[480px]">
        {/* Main Photo (Left Half) */}
        <div className="md:col-span-2 relative overflow-hidden bg-dark-100">
          <img
            src={spot.photos[0]}
            alt={spot.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500 cursor-pointer"
            onClick={() => setShowAllPhotos(true)}
          />
        </div>

        {/* 4 Thumbnails (Right Grid) */}
        <div className="hidden md:grid md:col-span-2 grid-cols-2 gap-2">
          {[1, 2, 3, 4].map(idx => (
            <div key={idx} className="relative overflow-hidden bg-dark-100 h-full">
              <img
                src={spot.photos[idx % spot.photos.length]}
                alt=""
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500 cursor-pointer"
                onClick={() => setShowAllPhotos(true)}
              />
            </div>
          ))}
        </div>

        {/* Floating "Show all photos" pill */}
        <button
          onClick={() => setShowAllPhotos(true)}
          className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl text-xs font-bold text-dark-900 shadow-md border border-dark-200 flex items-center gap-2 hover:bg-white transition-all"
        >
          <Grid className="w-3.5 h-3.5" />
          <span>Show all photos</span>
        </button>
      </div>

      {/* Main Content Layout: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start pt-4">
        {/* Left 8-Cols: Content */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-8 divide-y divide-dark-200">
          {/* Host header snippet */}
          <div className="flex items-center justify-between gap-4 pb-6">
            <div>
              <h2 className="text-xl font-extrabold text-dark-900">
                Shared spot hosted by {host?.name || 'Local RVer'}
              </h2>
              <p className="text-xs text-dark-600 mt-0.5">
                Up to {spot.rigCompatibility.maxLengthFt}ft RVs · {spot.spaceType.replace('_', ' ')} · {spot.environment}
              </p>
            </div>
            {host && (
              <img
                src={host.avatar}
                alt={host.name}
                className="w-14 h-14 rounded-full object-cover ring-2 ring-dark-200 shrink-0"
              />
            )}
          </div>

          {/* Airbnb Style Highlights */}
          <div className="py-6 space-y-4 text-xs">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-roo-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-dark-900 block">100% Free Community Hospitality</span>
                <span className="text-dark-600">No booking fees or nightly charges. RVers helping RVers.</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-dark-800 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-dark-900 block">Flexible Arrival Window</span>
                <span className="text-dark-600">Check-in between {spot.rules.checkInWindow}. Coordinate directly with host.</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-dark-900 block">Roo Privacy Shield</span>
                <span className="text-dark-600">Exact address and gate access revealed immediately upon confirmed stay.</span>
              </div>
            </div>
          </div>

          {/* About this space */}
          <div className="py-6 space-y-3">
            <h3 className="text-lg font-extrabold text-dark-900">About this spot</h3>
            <p className="text-sm text-dark-700 leading-relaxed font-normal">
              {spot.description}
            </p>
          </div>

          {/* 3D Spatial Rig & Pad Clearance Simulator */}
          <div className="py-6">
            <SpatialRigVisualizer spot={spot} />
          </div>

          {/* RV Compatibility */}
          <div className="py-6">
            <RigCompatibilityTable
              compat={spot.rigCompatibility}
              travelerRigLength={currentUser.role === 'traveler' ? currentUser.rig.lengthFt : undefined}
            />
          </div>

          {/* Amenities Grid */}
          <div className="py-6">
            <AmenitiesGrid
              amenities={spot.amenities}
              proximity={spot.proximity}
            />
          </div>

          {/* Host Profile */}
          {host && (
            <div className="py-6">
              <HostProfileCard
                host={host}
                spotId={spot.id}
                onMessageHost={handleMessageHost}
              />
            </div>
          )}

          {/* Reviews */}
          <div className="py-6">
            <ReviewsList
              reviews={spotReviews}
              users={users}
            />
          </div>
        </div>

        {/* Right 4-Cols / Sticky Booking Card */}
        <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-28">
          <Card className="p-6 border-border bg-card shadow-airbnb-hover space-y-5">
            {/* Price Row */}
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-black text-foreground">$0</span>
                <span className="text-xs text-muted-foreground font-medium ml-1">/ night (Free Stay)</span>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-foreground">
                <Star className="w-3.5 h-3.5 text-foreground fill-foreground" />
                <span>{spot.rating}</span>
                <span className="text-muted-foreground font-normal">({spot.reviewCount})</span>
              </div>
            </div>

            {/* Quick Date and Rig Box */}
            <div className="rounded-2xl border border-border divide-y divide-border text-xs overflow-hidden bg-background">
              <div className="grid grid-cols-2 divide-x divide-border">
                <div className="p-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">Arrival</span>
                  <span className="font-bold text-foreground">Sep 15, 2026</span>
                </div>
                <div className="p-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">Departure</span>
                  <span className="font-bold text-foreground">Sep 17, 2026</span>
                </div>
              </div>
              <div className="p-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">Vehicle & Guests</span>
                <span className="font-bold text-foreground">
                  {currentUser.rig?.lengthFt || 28}ft Class C · 2 Travelers
                </span>
              </div>
            </div>

            {/* Primary Action Button */}
            <Button
              onClick={() => setShowRequestModal(true)}
              variant="outdoor"
              size="lg"
              className="w-full flex items-center justify-center gap-2 text-sm shadow-md"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Request a Stay</span>
            </Button>

            <p className="text-[11px] text-muted-foreground text-center font-medium">
              You won't be charged. Stays are 100% free community hospitality.
            </p>

            <Separator />

            {/* Free Pricing Breakdown */}
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span className="underline">2 nights x $0</span>
                <span>$0</span>
              </div>
              <div className="flex justify-between">
                <span className="underline">CampRoo Community Fee</span>
                <span>$0</span>
              </div>
              <div className="flex justify-between">
                <span className="underline">Cleaning / Power Fee</span>
                <span>$0</span>
              </div>
              <Separator />
              <div className="flex justify-between font-black text-foreground text-sm pt-1">
                <span>Total</span>
                <span>$0</span>
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="outline"
                onClick={handleMessageHost}
                className="w-full text-xs font-bold"
              >
                Contact Host
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Request Modal */}
      {showRequestModal && (
        <RequestStayModal
          spot={spot}
          onClose={() => setShowRequestModal(false)}
          onSuccess={() => {
            setShowRequestModal(false);
            setCurrentView('trips');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {/* All Photos Lightbox Modal */}
      {showAllPhotos && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col p-4 sm:p-8 animate-fade-in">
          <div className="flex justify-between items-center text-white pb-4 border-b border-white/20">
            <span className="font-bold text-sm">{spot.title} · Photo Gallery</span>
            <Button
              variant="glass"
              size="sm"
              onClick={() => setShowAllPhotos(false)}
              className="text-white hover:text-white"
            >
              ✕ Close
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto py-6 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-5xl mx-auto">
            {spot.photos.map((photo, i) => (
              <img key={i} src={photo} alt="" className="w-full rounded-2xl object-cover shadow-lg" />
            ))}
          </div>
        </div>
      )}

      {/* Report Modal */}
      <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="w-5 h-5 text-destructive" />
              Report Spot to Safety Rangers
            </DialogTitle>
            <DialogDescription>
              Help us keep CampRoo trusted and safe for the entire RV community.
            </DialogDescription>
          </DialogHeader>

          <DialogBody>
            <form onSubmit={handleReportSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">Reason for Report</label>
                <select
                  value={reportReason}
                  onChange={e => setReportReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-input bg-background text-xs font-semibold text-foreground"
                >
                  <option value="Inaccurate description">Inaccurate description or rig limits</option>
                  <option value="Commercial solicitation">Commercial solicitation / Asking for money</option>
                  <option value="Safety or access concern">Safety or access hazard</option>
                  <option value="Unresponsive host">Unresponsive host</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1">Details</label>
                <textarea
                  rows={3}
                  required
                  value={reportDetails}
                  onChange={e => setReportDetails(e.target.value)}
                  placeholder="Explain what occurred or needs moderation..."
                  className="w-full p-2.5 rounded-xl border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReportModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  size="sm"
                >
                  Submit Report
                </Button>
              </div>
            </form>
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  );
};
