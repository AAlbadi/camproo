import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { RigCompatibilityTable } from './RigCompatibilityTable';
import { SpatialRigVisualizer } from './SpatialRigVisualizer';
import { AmenitiesGrid } from './AmenitiesGrid';
import { HostProfileCard } from './HostProfileCard';
import { ReviewsList } from './ReviewsList';
import { WriteReviewModal } from './WriteReviewModal';
import { RequestEditModal } from './RequestEditModal';
import { RequestStayModal } from './RequestStayModal';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody } from '../ui/dialog';
import { InteractiveMap } from '../explore/InteractiveMap';
import { getOptimizedImageUrl } from '../../lib/imageOptimizer';
import { isPublicSpot, getSpotAgencyInfo } from '../../types';
import {
  Star,
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  Share2,
  Heart,
  Clock,
  Navigation,
  ExternalLink,
  Trees,
  Compass,
  Copy,
  Check,
  Camera,
  Upload,
  Plus,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  PenLine,
  Edit3,
  CheckCircle2,
  Grid,
  MapPin
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
    addSpotPhotos,
    isSpotSaved,
    toggleSaveSpot,
  } = useApp();

  const { showToast } = useToast();

  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showAddPhotoModal, setShowAddPhotoModal] = useState(false);
  const [showWriteReviewModal, setShowWriteReviewModal] = useState(false);
  const [showRequestEditModal, setShowRequestEditModal] = useState(false);

  // Photo upload modal state
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [photoFileInput, setPhotoFileInput] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoCaption, setPhotoCaption] = useState('');
  const [isSubmittingPhoto, setIsSubmittingPhoto] = useState(false);

  // Report modal state
  const [reportReason, setReportReason] = useState('Inaccurate description');
  const [reportDetails, setReportDetails] = useState('');
  const [copiedGps, setCopiedGps] = useState(false);

  const spot = spots.find(s => s.id === selectedSpotId);
  const isSaved = spot ? isSpotSaved(spot.id) : false;
  const host = spot ? users.find(u => u.id === spot.hostId) : undefined;
  const spotReviews = spot ? reviews.filter(r => r.spotId === spot.id) : [];
  const isPublic = spot ? isPublicSpot(spot, users) : true;
  const agencyInfo = spot ? getSpotAgencyInfo(spot) : { agency: 'Public Land', shortName: 'Public', isFederal: true };

  const handleCopyGps = () => {
    if (!spot) return;
    navigator.clipboard?.writeText(`${spot.coordinates[0].toFixed(6)}, ${spot.coordinates[1].toFixed(6)}`);
    setCopiedGps(true);
    showToast('GPS coordinates copied to clipboard!', 'success');
    setTimeout(() => setCopiedGps(false), 2500);
  };

  React.useEffect(() => {
    if (spot && typeof window !== 'undefined') {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        if (searchParams.get('spot') !== spot.id) {
          const url = new URL(window.location.href);
          url.searchParams.set('spot', spot.id);
          url.searchParams.set('view', 'spot-detail');
          url.hash = 'spot-detail';
          window.history.replaceState({ view: 'spot-detail', spot: spot.id }, '', url.toString());
        }
      } catch (e) {}
    }
  }, [spot]);

  if (!spot) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto text-2xl font-bold">
          404
        </div>
        <h2 className="text-2xl font-extrabold text-foreground">Spot No Longer Available</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          This campsite listing has been permanently removed from CampRoo. Only verified public domain campsites are listed.
        </p>
        <Button
          variant="primary"
          onClick={() => {
            setCurrentView('explore');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          Explore Verified Free Spots
        </Button>
      </div>
    );
  }

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFileInput(file);
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddPhotoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingPhoto(true);

    try {
      let finalPhotoUrl = '';

      if (uploadMode === 'file' && photoPreview) {
        try {
          const resp = await fetch(`/api/spots/${spot.id}/photos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageBase64: photoPreview,
              filename: photoFileInput?.name || 'campsite-photo.jpg',
              caption: photoCaption,
            }),
          });
          if (resp.ok) {
            const data = await resp.json();
            if (data.photoUrl) {
              finalPhotoUrl = data.photoUrl;
            }
          }
        } catch (err) {
          console.warn('Backend upload skipped, saving locally:', err);
        }

        if (!finalPhotoUrl) {
          finalPhotoUrl = photoPreview;
        }
      } else if (uploadMode === 'url' && photoUrlInput.trim()) {
        const clean = photoUrlInput.trim();
        if (clean.includes('unsplash.com') || clean.includes('pexels.com')) {
          showToast('Please only share authentic photos of the actual camping spot or public land.', 'error');
          setIsSubmittingPhoto(false);
          return;
        }
        finalPhotoUrl = clean;

        try {
          await fetch(`/api/spots/${spot.id}/photos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ photoUrl: clean, caption: photoCaption }),
          });
        } catch (err) {}
      }

      if (finalPhotoUrl) {
        addSpotPhotos(spot.id, [finalPhotoUrl]);
        showToast('Real campsite photo added! Thank you for helping fellow campers.', 'success');
        setShowAddPhotoModal(false);
        setPhotoPreview(null);
        setPhotoFileInput(null);
        setPhotoUrlInput('');
        setPhotoCaption('');
      } else {
        showToast('Please select an image file or enter a valid photo URL.', 'error');
      }
    } catch (err) {
      showToast('Could not save photo. Please try again.', 'error');
    } finally {
      setIsSubmittingPhoto(false);
    }
  };

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

  const googleMapsUrl = spot.googleMapsUrl || `https://www.google.com/maps/dir/?api=1&destination=${spot.coordinates[0]},${spot.coordinates[1]}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 lg:pb-12 space-y-7 animate-fade-in bg-background text-foreground">
      {/* Top Header: Breadcrumb, Badges, Title, Coordinates & Quick Action Bar */}
      <div className="space-y-3">
        {/* Navigation row */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setCurrentView('explore');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="inline-flex items-center gap-2 text-xs font-bold -ml-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Spots</span>
          </Button>

          {/* Quick Action Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowWriteReviewModal(true)}
              className="text-xs font-bold gap-1.5 hidden sm:inline-flex bg-background hover:bg-secondary/60"
            >
              <PenLine className="w-3.5 h-3.5 text-emerald-600" />
              <span>Write Review</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddPhotoModal(true)}
              className="text-xs font-bold gap-1.5 hidden sm:inline-flex bg-background hover:bg-secondary/60"
            >
              <Camera className="w-3.5 h-3.5 text-emerald-600" />
              <span>Add Photos</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRequestEditModal(true)}
              className="text-xs font-bold gap-1.5 hidden sm:inline-flex bg-background hover:bg-secondary/60"
              title="Request an update or correction for this spot"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-600" />
              <span>Suggest Edit</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const shareUrl = `${window.location.origin}${window.location.pathname}?view=spot-detail&spot=${spot.id}`;
                navigator.clipboard?.writeText(shareUrl);
                showToast('Spot link copied to clipboard!', 'success');
              }}
              className="flex items-center gap-1.5 text-xs bg-background"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleSaveSpot(spot.id)}
              className="flex items-center gap-1.5 text-xs bg-background"
            >
              <Heart className={`w-3.5 h-3.5 ${isSaved ? 'text-rose-500 fill-rose-500' : ''}`} />
              <span>{isSaved ? 'Saved' : 'Save'}</span>
            </Button>
          </div>
        </div>

        {/* Spot Title & Agency Badge */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            {isPublic ? (
              <Badge className="gap-1.5 bg-emerald-100 text-emerald-950 dark:bg-emerald-950/80 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700 font-extrabold text-[11px]">
                <Trees className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                <span>{agencyInfo.agency} · 100% Free Public Land</span>
              </Badge>
            ) : (
              <Badge className="gap-1 bg-emerald-100 text-emerald-950 dark:bg-emerald-950/80 dark:text-emerald-200 font-extrabold text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Roo Verified Community Host</span>
              </Badge>
            )}

            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
              <span>{spot.locationName}, {spot.generalArea}</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight">
            {spot.title}
          </h1>
        </div>

        {/* Meta Bar: Rating, Reviews, GPS Coordinates, Agency & Report link */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground font-semibold pt-1 border-b border-border/80 pb-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => {
                const el = document.getElementById('reviews-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center gap-1 text-foreground font-bold hover:underline"
            >
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>{spot.rating}</span>
              <span className="text-muted-foreground ml-0.5">
                ({spot.reviewCount} {spot.reviewCount === 1 ? 'review' : 'reviews'})
              </span>
            </button>

            <span>·</span>

            <button
              onClick={handleCopyGps}
              className="inline-flex items-center gap-1 font-mono text-xs text-foreground hover:text-emerald-700 dark:hover:text-emerald-400 font-bold transition-colors"
              title="Click to copy GPS coordinates"
            >
              <Compass className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
              <span>{spot.coordinates[0].toFixed(5)}, {spot.coordinates[1].toFixed(5)}</span>
              {copiedGps ? (
                <Check className="w-3 h-3 text-emerald-600 ml-0.5" />
              ) : (
                <Copy className="w-3 h-3 text-muted-foreground ml-0.5" />
              )}
            </button>

            <span>·</span>

            <span className="text-emerald-800 dark:text-emerald-400 font-extrabold">
              {isPublic ? 'Open Public Domain · First-Come First-Served' : 'Free Community Hospitality'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowRequestEditModal(true)}
              className="text-[11px] text-muted-foreground hover:text-foreground underline transition-colors"
            >
              Suggest an Edit
            </button>
            <span>·</span>
            <button
              onClick={() => setShowReportModal(true)}
              className="text-[11px] text-muted-foreground hover:text-rose-600 underline transition-colors"
            >
              Report listing
            </button>
          </div>
        </div>
      </div>

      {/* Signature 5-Photo Responsive Gallery */}
      <div className="relative rounded-3xl overflow-hidden grid grid-cols-1 md:grid-cols-4 gap-2 aspect-[16/9] md:aspect-[20/9] max-h-[460px] bg-secondary shadow-md border border-border">
        {/* Main Hero Photo (Left Half) */}
        <div className="md:col-span-2 relative overflow-hidden h-full bg-secondary/80">
          <img
            src={getOptimizedImageUrl(spot.photos[0], { width: 900, quality: 85 })}
            alt={spot.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500 cursor-pointer"
            onClick={() => setShowAllPhotos(true)}
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.src.includes('real_bald_mountain')) {
                target.src = '/images/real_bald_mountain.jpg';
              }
            }}
          />
        </div>

        {/* 4 Thumbnails (Right Grid) */}
        <div className="hidden md:grid md:col-span-2 grid-cols-2 gap-2 h-full">
          {[1, 2, 3, 4].map(idx => (
            <div key={idx} className="relative overflow-hidden bg-secondary/80 h-full">
              <img
                src={getOptimizedImageUrl(spot.photos[idx % spot.photos.length], { width: 500, quality: 80 })}
                alt=""
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500 cursor-pointer"
                onClick={() => setShowAllPhotos(true)}
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.includes('real_bald_mountain')) {
                    target.src = '/images/real_bald_mountain.jpg';
                  }
                }}
              />
            </div>
          ))}
        </div>

        {/* Floating Photo Actions */}
        <div className="absolute bottom-4 right-4 flex items-center gap-2 z-10">
          <button
            onClick={() => setShowAddPhotoModal(true)}
            className="bg-emerald-800/90 hover:bg-emerald-900 text-white backdrop-blur-md px-3.5 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
            title="Upload your own photo of this campsite"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Add Photos</span>
          </button>
          <button
            onClick={() => setShowAllPhotos(true)}
            className="bg-card/90 hover:bg-card backdrop-blur-md px-3.5 py-2 rounded-xl text-xs font-bold text-foreground shadow-lg border border-border flex items-center gap-1.5 transition-all"
          >
            <Grid className="w-3.5 h-3.5" />
            <span>View all photos ({spot.photos.length})</span>
          </button>
        </div>
      </div>

      {/* Main Content Layout: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start pt-2">
        {/* Left Column: Details, Specs, Rig Inspector, Amenities, Map, Reviews */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-8 divide-y divide-border">
          {/* Quick Highlights Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2 text-xs">
            <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold text-foreground block">
                  {isPublic ? '100% Free Public Land Stay' : '100% Free Community Stay'}
                </span>
                <span className="text-muted-foreground">
                  Zero booking fees or nightly charges. Open for boondocking and RV camping.
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border flex items-start gap-3">
              <Compass className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold text-foreground block">
                  {isPublic ? 'First-Come, First-Served' : 'Host Approved Stay'}
                </span>
                <span className="text-muted-foreground">
                  {isPublic ? 'No advance permits or reservations required. Pull up and camp.' : 'Coordinate directly with your verified RVer host.'}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border flex items-start gap-3">
              <Clock className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold text-foreground block">
                  {spot.rules?.maxStayNights || 14}-Day Dispersed Stay Limit
                </span>
                <span className="text-muted-foreground">
                  Standard {agencyInfo.shortName} regulations allow up to {spot.rules?.maxStayNights || 14} consecutive days of stay.
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border flex items-start gap-3">
              <Navigation className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold text-foreground block">
                  Direct Satellite GPS Waypoint
                </span>
                <span className="text-muted-foreground">
                  Coordinates verified for offline GPS maps and offline boondocking navigation.
                </span>
              </div>
            </div>
          </div>

          {/* About this space */}
          <div className="pt-6 space-y-3">
            <h3 className="text-xl font-black text-foreground">About this spot</h3>
            <p className="text-sm text-foreground/90 leading-relaxed font-normal">
              {spot.description}
            </p>
          </div>

          {/* Clean Interactive RV Fit & Pad Clearance Inspector */}
          <div className="pt-6 space-y-3">
            <SpatialRigVisualizer
              spot={spot}
              defaultRigLength={currentUser.role === 'traveler' ? currentUser.rig?.lengthFt : undefined}
            />
          </div>

          {/* RV Compatibility & Accepted Classes */}
          <div className="pt-6">
            <RigCompatibilityTable
              compat={spot.rigCompatibility}
              travelerRigLength={currentUser.role === 'traveler' ? currentUser.rig?.lengthFt : undefined}
            />
          </div>

          {/* Amenities & Hookups Grid */}
          <div className="pt-6">
            <AmenitiesGrid
              amenities={spot.amenities}
              proximity={spot.proximity}
            />
          </div>

          {/* Public Land Guidelines Card OR Host Profile Card */}
          <div className="pt-6">
            {isPublic ? (
              <Card className="p-6 sm:p-7 border-emerald-200 dark:border-emerald-800/80 bg-gradient-to-br from-emerald-50/50 via-card to-emerald-50/20 dark:from-emerald-950/20 dark:via-card dark:to-emerald-950/10 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-emerald-100 dark:border-emerald-900/50">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-800 dark:text-emerald-300 shrink-0">
                      <Trees className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-foreground">{agencyInfo.agency}</h3>
                        <Badge className="text-[10px] bg-emerald-100 text-emerald-900 dark:bg-emerald-900/80 dark:text-emerald-200 border-emerald-300">
                          {agencyInfo.shortName} Land
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                        Dispersed Public Domain Camping · {spot.generalArea}
                      </p>
                    </div>
                  </div>

                  <a
                    href={spot._pipeline?.source_url || (agencyInfo.shortName === 'USFS' ? 'https://www.fs.usda.gov/' : 'https://www.blm.gov/')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-background hover:bg-secondary text-foreground border border-border text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs shrink-0 self-start sm:self-auto"
                  >
                    <span>Agency Website</span>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                  </a>
                </div>

                {/* Guidelines Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  <div className="p-3.5 rounded-2xl bg-card border border-border space-y-1">
                    <div className="text-[11px] font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
                      🌲 Dispersed Camping Rules
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      Camp within designated clearings or one vehicle length of forest roads. Do not drive over vegetation or create unauthorized new tracks.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-card border border-border space-y-1">
                    <div className="text-[11px] font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
                      🔥 Campfire Regulations
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      Always check local fire danger levels and bans. Attend campfires at all times and drown with water until cold to the touch.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-card border border-border space-y-1">
                    <div className="text-[11px] font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
                      🚯 Leave No Trace
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      Pack it in, pack it out. There are no trash bins in dispersed public areas. Dispose of all greywater responsibly.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-card border border-border space-y-1">
                    <div className="text-[11px] font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
                      📡 Self-Contained Boondocking
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      Arrive fully self-contained with fresh water, power, and food. Download offline maps before entering backcountry roads.
                    </p>
                  </div>
                </div>
              </Card>
            ) : (
              host && (
                <HostProfileCard
                  host={host}
                  spotId={spot.id}
                  onMessageHost={handleMessageHost}
                />
              )
            )}
          </div>

          {/* Location & Map Section */}
          <div className="pt-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-black text-foreground">Spot Location & Coordinates</h3>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">
                  {spot.locationName}, {spot.generalArea} · GPS: {spot.coordinates[0].toFixed(5)}, {spot.coordinates[1].toFixed(5)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyGps}
                  className="text-xs font-bold gap-1"
                >
                  {copiedGps ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedGps ? 'Copied' : 'Copy GPS'}</span>
                </Button>

                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/70 hover:bg-blue-100 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center gap-1.5 transition-colors border border-blue-200 dark:border-blue-800 shadow-2xs"
                >
                  <Navigation className="w-3.5 h-3.5 text-blue-600" />
                  <span>Google Maps GPS</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>
              </div>
            </div>

            <div className="relative w-full h-80 rounded-3xl overflow-hidden border border-border shadow-xs">
              <InteractiveMap
                allSpots={[spot]}
                visibleSpots={[spot]}
                hoveredSpotId={spot.id}
                selectedSpotId={spot.id}
                isolateSelectedSpot={true}
                onSelectSpot={() => {}}
                activeRoute={null}
                origin={{ name: 'Current Location', coordinates: [spot.coordinates[0], spot.coordinates[1]] }}
                onChangeOrigin={() => {}}
                isSimulatingDrive={false}
                isExpanded={true}
                className="w-full h-full"
              />
            </div>
          </div>

          {/* Community Photo Showcase */}
          <div className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-foreground">Community Photos</h3>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">
                  Real photos taken on-site by travelers and public land stewards
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setShowAddPhotoModal(true)}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs gap-1.5 shadow-xs"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Add Photos</span>
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {spot.photos.slice(0, 4).map((photo, i) => (
                <div
                  key={i}
                  onClick={() => setShowAllPhotos(true)}
                  className="relative aspect-video sm:aspect-square rounded-2xl overflow-hidden border border-border cursor-pointer group bg-secondary"
                >
                  <img
                    src={getOptimizedImageUrl(photo, { width: 400, quality: 80 })}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.src.includes('real_bald_mountain')) {
                        target.src = '/images/real_bald_mountain.jpg';
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-xs font-bold bg-black/60 px-2 py-1 rounded-lg backdrop-blur-xs">
                      Enlarge
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Traveler Reviews & Field Reports Section */}
          <div id="reviews-section" className="pt-6">
            <ReviewsList
              reviews={spotReviews}
              users={users}
              onWriteReview={() => setShowWriteReviewModal(true)}
            />
          </div>

          {/* Bottom Crowdsource Help Banner */}
          <div className="pt-6">
            <div className="p-4 rounded-3xl bg-secondary/40 border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-extrabold text-foreground block">
                  Notice outdated info or road changes?
                </span>
                <span className="text-muted-foreground">
                  CampRoo is powered by real RVers. Help keep road conditions and rig limits accurate.
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowRequestEditModal(true)}
                className="shrink-0 text-xs font-bold gap-1.5 bg-background"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                <span>Suggest an Edit</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Action & Free Stay Box */}
        <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-24">
          {isPublic ? (
            /* Public Land Stay Card */
            <Card className="p-6 border-border bg-card shadow-lg space-y-5 rounded-3xl">
              <div className="flex items-baseline justify-between pb-2 border-b border-border">
                <div>
                  <span className="text-2xl font-black text-foreground tracking-tight">FREE TO STAY</span>
                  <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold block mt-0.5">
                    100% Free Public Land · Zero Booking Fees
                  </span>
                </div>
                {spot.reviewCount > 0 ? (
                  <div className="flex items-center gap-1 text-xs font-bold text-foreground bg-secondary/60 px-2.5 py-1 rounded-xl">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>{spot.rating}</span>
                    <span className="text-muted-foreground font-normal">({spot.reviewCount})</span>
                  </div>
                ) : (
                  <Badge className="text-[10px] bg-emerald-100 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                    Verified Land
                  </Badge>
                )}
              </div>

              {/* Specs Box */}
              <div className="rounded-2xl border border-border divide-y divide-border text-xs overflow-hidden bg-background">
                <div className="grid grid-cols-2 divide-x divide-border">
                  <div className="p-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">Access Style</span>
                    <span className="font-bold text-foreground">First-Come, First-Served</span>
                  </div>
                  <div className="p-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">Stay Limit</span>
                    <span className="font-bold text-foreground">Up to {spot.rules?.maxStayNights || 14} Nights</span>
                  </div>
                </div>

                <div className="p-3 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">GPS Coordinates</span>
                    <span className="font-mono font-bold text-foreground text-xs">
                      {spot.coordinates[0].toFixed(5)}, {spot.coordinates[1].toFixed(5)}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyGps}
                    className="h-7 px-2.5 text-[11px] font-bold shrink-0 gap-1"
                  >
                    {copiedGps ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </Button>
                </div>

                <div className="p-3 bg-secondary/30">
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">Rig Clearance</span>
                  <span className="font-bold text-foreground">
                    Up to {spot.rigCompatibility.maxLengthFt}ft · {spot.rigCompatibility.surfaceType.replace('_', ' ')} · {spot.rigCompatibility.accessType.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Primary Action Button: Direct GPS Turn-by-Turn Navigation */}
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm shadow-md transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <Navigation className="w-4 h-4" />
                <span>Get Driving Directions (GPS)</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>

              {/* Secondary Buttons: Save & Share */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => toggleSaveSpot(spot.id)}
                  className="w-full text-xs font-bold gap-1.5"
                >
                  <Heart className={`w-3.5 h-3.5 ${isSaved ? 'text-rose-500 fill-rose-500' : ''}`} />
                  <span>{isSaved ? 'Saved' : 'Save Spot'}</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const shareUrl = `${window.location.origin}${window.location.pathname}?view=spot-detail&spot=${spot.id}`;
                    navigator.clipboard?.writeText(shareUrl);
                    showToast('Spot link copied to clipboard!', 'success');
                  }}
                  className="w-full text-xs font-bold gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share Spot</span>
                </Button>
              </div>

              {/* Community Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowWriteReviewModal(true)}
                  className="w-full text-xs font-bold gap-1 text-emerald-800 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                >
                  <PenLine className="w-3.5 h-3.5" />
                  <span>Write Review</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRequestEditModal(true)}
                  className="w-full text-xs font-bold gap-1 text-amber-800 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Suggest Edit</span>
                </Button>
              </div>

              {/* Public Land Notice */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800 text-xs text-emerald-950 dark:text-emerald-200 space-y-1">
                <div className="flex items-center gap-1.5 font-extrabold text-emerald-900 dark:text-emerald-300">
                  <Trees className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                  <span>Always Free · No Host Approval Needed</span>
                </div>
                <p className="text-[11px] text-emerald-900/80 dark:text-emerald-300/80 leading-relaxed">
                  This campsite is on federal / public domain land. Sites are first-come, first-served. Practice Leave No Trace and check local fire regulations.
                </p>
              </div>
            </Card>
          ) : (
            /* Host Listing Stay Card */
            <Card className="p-6 border-border bg-card shadow-lg space-y-5 rounded-3xl">
              <div className="flex items-baseline justify-between pb-2 border-b border-border">
                <div>
                  <span className="text-2xl font-black text-foreground">$0</span>
                  <span className="text-xs text-muted-foreground font-medium ml-1">/ night (Free Community Stay)</span>
                </div>
                {spot.reviewCount > 0 ? (
                  <div className="flex items-center gap-1 text-xs font-bold text-foreground">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>{spot.rating}</span>
                    <span className="text-muted-foreground font-normal">({spot.reviewCount})</span>
                  </div>
                ) : (
                  <span className="text-xs font-bold text-muted-foreground">New Host Listing</span>
                )}
              </div>

              <div className="rounded-2xl border border-border divide-y divide-border text-xs overflow-hidden bg-background">
                <div className="grid grid-cols-2 divide-x divide-border">
                  <div className="p-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">Max RV Length</span>
                    <span className="font-bold text-foreground">{spot.rigCompatibility.maxLengthFt} ft</span>
                  </div>
                  <div className="p-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">Check-In</span>
                    <span className="font-bold text-foreground">{spot.rules?.checkInWindow || 'Flexible'}</span>
                  </div>
                </div>
                <div className="p-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">Vehicle & Guests</span>
                  <span className="font-bold text-foreground">
                    {currentUser.rig?.lengthFt || 28}ft Rig · 2 Travelers
                  </span>
                </div>
              </div>

              <Button
                onClick={() => setShowRequestModal(true)}
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md"
              >
                Request a Stay
              </Button>

              <Button
                variant="outline"
                onClick={handleMessageHost}
                className="w-full text-xs font-bold"
              >
                Contact Host
              </Button>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowWriteReviewModal(true)}
                  className="w-full text-xs font-bold gap-1 text-emerald-800 dark:text-emerald-400"
                >
                  <PenLine className="w-3.5 h-3.5" />
                  <span>Write Review</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRequestEditModal(true)}
                  className="w-full text-xs font-bold gap-1 text-amber-800 dark:text-amber-400"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Suggest Edit</span>
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Write Review Modal */}
      <WriteReviewModal
        spot={spot}
        isOpen={showWriteReviewModal}
        onClose={() => setShowWriteReviewModal(false)}
      />

      {/* Request Edit Modal */}
      <RequestEditModal
        spot={spot}
        isOpen={showRequestEditModal}
        onClose={() => setShowRequestEditModal(false)}
      />

      {/* Request Stay Modal (Host spots) */}
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

      {/* Full Screen Photo Gallery Modal */}
      {showAllPhotos && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col p-4 sm:p-8 animate-fade-in">
          <div className="flex justify-between items-center text-white pb-4 border-b border-white/20 max-w-6xl mx-auto w-full">
            <div>
              <h2 className="font-black text-base sm:text-lg">{spot.title}</h2>
              <span className="text-xs text-white/70">Photo Gallery ({spot.photos.length} photos)</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => {
                  setShowAllPhotos(false);
                  setShowAddPhotoModal(true);
                }}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs gap-1"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Add Your Photo</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAllPhotos(false)}
                className="text-white bg-white/10 hover:bg-white/20 border-white/30"
              >
                ✕ Close
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto py-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-6xl mx-auto w-full">
            {spot.photos.map((photo, i) => (
              <div key={i} className="aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-900 border border-white/10">
                <img
                  src={getOptimizedImageUrl(photo, { width: 900, quality: 85 })}
                  alt=""
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.includes('real_bald_mountain')) {
                      target.src = '/images/real_bald_mountain.jpg';
                    }
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Photo Modal */}
      <Dialog open={showAddPhotoModal} onOpenChange={setShowAddPhotoModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400">
              <Camera className="w-5 h-5" />
              Contribute Photos to {spot.title}
            </DialogTitle>
            <DialogDescription>
              Help fellow boondockers! Add authentic photos of campsite clearings, road access, or views.
            </DialogDescription>
          </DialogHeader>

          <DialogBody>
            <div className="flex border-b border-border mb-4">
              <button
                type="button"
                onClick={() => setUploadMode('file')}
                className={`flex-1 py-2 text-xs font-bold border-b-2 flex items-center justify-center gap-2 transition-colors ${
                  uploadMode === 'file'
                    ? 'border-emerald-700 text-emerald-800 dark:text-emerald-400 font-extrabold'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                Upload File
              </button>
              <button
                type="button"
                onClick={() => setUploadMode('url')}
                className={`flex-1 py-2 text-xs font-bold border-b-2 flex items-center justify-center gap-2 transition-colors ${
                  uploadMode === 'url'
                    ? 'border-emerald-700 text-emerald-800 dark:text-emerald-400 font-extrabold'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                Image URL
              </button>
            </div>

            <form onSubmit={handleAddPhotoSubmit} className="space-y-4">
              {uploadMode === 'file' ? (
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Select Photo from Device</label>
                  <label className="border-2 border-dashed border-border hover:border-emerald-600 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors bg-secondary/30 hover:bg-emerald-50/20">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoFileChange}
                      className="hidden"
                    />
                    {photoPreview ? (
                      <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-inner">
                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <span className="text-white text-xs font-bold">Click to change photo</span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-emerald-700 dark:text-emerald-400 mb-2" />
                        <span className="text-xs font-bold text-foreground">Tap to upload campsite photo</span>
                        <span className="text-[11px] text-muted-foreground mt-0.5">JPG, PNG, WebP up to 10MB</span>
                      </>
                    )}
                  </label>
                </div>
              ) : (
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Direct Image URL</label>
                  <input
                    type="url"
                    required
                    value={photoUrlInput}
                    onChange={e => setPhotoUrlInput(e.target.value)}
                    placeholder="https://.../campsite.jpg"
                    className="w-full p-2.5 rounded-xl border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Paste a direct image link from Wikimedia Commons, USFS, or your public photo host.
                  </p>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-foreground block mb-1">Caption or Access Note (Optional)</label>
                <input
                  type="text"
                  value={photoCaption}
                  onChange={e => setPhotoCaption(e.target.value)}
                  placeholder="e.g. Turnout on FR-104 with fire ring, cell service 3 bars"
                  className="w-full p-2.5 rounded-xl border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddPhotoModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingPhoto || (uploadMode === 'file' ? !photoPreview : !photoUrlInput.trim())}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs"
                  size="sm"
                >
                  {isSubmittingPhoto ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Contribute Photo
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogBody>
        </DialogContent>
      </Dialog>

      {/* Report Modal */}
      <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
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
                  className="w-full p-2.5 rounded-xl border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-600"
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

      {/* Sticky Mobile Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-[550] bg-background/95 backdrop-blur-2xl border-t border-border px-4 py-2.5 pb-[calc(env(safe-area-inset-bottom,8px)+8px)] shadow-[0_-8px_30px_rgba(0,0,0,0.12)] flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-base font-black text-foreground">
              {isPublic ? 'FREE TO STAY' : '$0 FREE'}
            </span>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">
              {isPublic ? '· Public Land' : '/ night'}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground font-extrabold flex items-center gap-1">
            <span>🚐 Up to {spot.rigCompatibility.maxLengthFt}ft</span>
            <span>·</span>
            {spot.reviewCount > 0 ? (
              <span className="text-amber-500">★ {spot.rating}</span>
            ) : (
              <span className="text-emerald-700 dark:text-emerald-400">{isPublic ? 'Verified Land' : 'New Listing'}</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowWriteReviewModal(true)}
            className="p-2.5 rounded-2xl bg-secondary hover:bg-secondary/80 border border-border text-foreground active:scale-95 transition-transform"
            title="Write a Review"
          >
            <PenLine className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
          </button>

          <button
            onClick={() => toggleSaveSpot(spot.id)}
            className="p-2.5 rounded-2xl bg-secondary hover:bg-secondary/80 border border-border text-foreground active:scale-95 transition-transform"
            title={isSaved ? 'Remove from Saved' : 'Save Spot'}
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'text-rose-500 fill-rose-500' : 'text-muted-foreground'}`} />
          </button>

          {isPublic ? (
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black shadow-md flex items-center gap-1.5 active:scale-95 transition-transform"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Directions</span>
            </a>
          ) : (
            <button
              onClick={() => setShowRequestModal(true)}
              className="px-5 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black shadow-md flex items-center gap-1.5 active:scale-95 transition-transform"
            >
              <span>Request Stay</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
