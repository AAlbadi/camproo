import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import {
  SpaceType,
  EnvironmentType,
  RVType,
  RV_TYPE_LABELS,
  GatekeepingRequirement,
  Spot
} from '../../types';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Globe,
  Lock,
  Mail,
  User,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Plus,
  Trash2,
  Eye,
  ShieldCheck,
  Send,
  Trees,
  Home,
  Compass,
  Navigation,
  Check,
  Search,
  MapPin,
  ExternalLink,
  Loader2,
  Copy,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const HostOnboardingWizard: React.FC = () => {
  const { currentUser, submitSpotWithReview, setCurrentView, setSelectedSpotId } = useApp();
  const { showToast } = useToast();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSpot, setSubmittedSpot] = useState<Spot | null>(null);

  // Spot Category: Public Free Space vs Hosted by a Person
  const [spotCategory, setSpotCategory] = useState<'public_free' | 'host_hosted'>('public_free');
  const [landManager, setLandManager] = useState<string>('BLM');

  // Spot Sharing Mode: Public Community Listing vs Personal Private Record
  const [visibility, setVisibility] = useState<'public' | 'personal'>('public');

  // Submitter Contact Details
  const [submitterName, setSubmitterName] = useState(currentUser?.name || '');
  const [submitterEmail, setSubmitterEmail] = useState(currentUser?.email || '');
  const [submitterPhone, setSubmitterPhone] = useState(currentUser?.phone || '');
  const [submitterNotes, setSubmitterNotes] = useState('');

  // Sync with currentUser when logged in
  React.useEffect(() => {
    if (currentUser?.email && !submitterEmail) setSubmitterEmail(currentUser.email);
    if (currentUser?.name && !submitterName) setSubmitterName(currentUser.name);
    if (currentUser?.phone && !submitterPhone) setSubmitterPhone(currentUser.phone);
  }, [currentUser]);

  // Spot Identity
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [spaceType, setSpaceType] = useState<SpaceType>('desert_oasis');
  const [environment, setEnvironment] = useState<EnvironmentType>('desert');

  // Location & Smart Google Maps Link / GPS input
  const [googleMapsInput, setGoogleMapsInput] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [isLocatingCurrentGps, setIsLocatingCurrentGps] = useState(false);
  const [extractionStatus, setExtractionStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const [locationName, setLocationName] = useState('');
  const [generalArea, setGeneralArea] = useState('');
  const [latitude, setLatitude] = useState('34.8697');
  const [longitude, setLongitude] = useState('-111.7610');
  const [exactAddressSecret, setExactAddressSecret] = useState('');
  const [arrivalGateCodeSecret, setArrivalGateCodeSecret] = useState('');

  // Rig Compatibility
  const [maxLengthFt, setMaxLengthFt] = useState(35);
  const [maxHeightFt, setMaxHeightFt] = useState(13.5);
  const [maxWidthFt, setMaxWidthFt] = useState(8.5);
  const [accessType, setAccessType] = useState<'pull_through' | 'back_in' | 'circular_drive'>('pull_through');
  const [surfaceType, setSurfaceType] = useState<'level_concrete' | 'packed_gravel' | 'firm_grass' | 'desert_hardpack' | 'dirt'>('packed_gravel');
  const [isLevel, setIsLevel] = useState(true);
  const [acceptedTypes, setAcceptedTypes] = useState<RVType[]>([
    'class_b',
    'class_c',
    'travel_trailer',
    'campervan',
  ]);
  const [turnaroundSpace, setTurnaroundSpace] = useState('Spacious area with wide turnaround radius.');

  // Amenities & Hookups
  const [electricity, setElectricity] = useState<'none' | '15amp' | '30amp' | '50amp'>('none');
  const [water, setWater] = useState<'potable_hookup' | 'spigot_fill' | 'non_potable' | 'none'>('none');
  const [sewer, setSewer] = useState<'full_hookup' | 'dump_station_on_site' | 'nearby_dump' | 'none'>('none');
  const [wifi, setWifi] = useState(false);
  const [wifiSpeed, setWifiSpeed] = useState('');
  const [firePit, setFirePit] = useState(true);
  const [trash, setTrash] = useState(false);
  const [petsAllowed, setPetsAllowed] = useState(true);
  const [generatorsAllowed, setGeneratorsAllowed] = useState(true);

  // Rules
  const [maxStayNights, setMaxStayNights] = useState(14);
  const [checkInWindow, setCheckInWindow] = useState('Anytime (First-Come, First-Served)');
  const [checkOutTime, setCheckOutTime] = useState('12:00 PM');
  const [quietHours, setQuietHours] = useState('10:00 PM - 7:00 AM');
  const [campfirePolicy, setCampfirePolicy] = useState('Allowed in existing fire ring; follow local fire bans');

  // Gatekeeping
  const [gatekeeping, setGatekeeping] = useState<GatekeepingRequirement>('any_member');

  // Photos
  const [photos, setPhotos] = useState<string[]>([
    '/images/real_rv_camping_hero.jpg',
    '/images/real_bald_mountain.jpg',
  ]);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');

  // Handle switching category
  const handleSelectCategory = (cat: 'public_free' | 'host_hosted') => {
    setSpotCategory(cat);
    if (cat === 'public_free') {
      setSpaceType('desert_oasis');
      setEnvironment('desert');
      setElectricity('none');
      setWater('none');
      setMaxStayNights(14);
      setCheckInWindow('Anytime (First-Come, First-Served)');
      setCampfirePolicy('Allowed in existing fire ring; follow local fire bans');
      setGatekeeping('any_member');
    } else {
      setSpaceType('driveway');
      setEnvironment('rural');
      setElectricity('30amp');
      setWater('potable_hookup');
      setMaxStayNights(3);
      setCheckInWindow('2:00 PM - 8:00 PM');
      setCampfirePolicy('Allowed in provided fire bowl');
      setGatekeeping('verified_id_only');
    }
  };

  const toggleAcceptedType = (type: RVType) => {
    if (acceptedTypes.includes(type)) {
      setAcceptedTypes(prev => prev.filter(t => t !== type));
    } else {
      setAcceptedTypes(prev => [...prev, type]);
    }
  };

  const handleAddPhoto = () => {
    const trimmed = newPhotoUrl.trim();
    if (!trimmed) return;
    setPhotos(prev => [...prev, trimmed]);
    setNewPhotoUrl('');
    showToast('Photo added!', 'success');
  };

  const handleAddPresetPhoto = (url: string) => {
    if (photos.includes(url)) {
      showToast('Photo already attached!', 'info');
      return;
    }
    setPhotos(prev => [...prev, url]);
    showToast('Scenic photo added!', 'success');
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSelectPresetLocation = (city: string, state: string, lat: number, lng: number) => {
    setLocationName(city);
    setGeneralArea(state);
    setLatitude(lat.toString());
    setLongitude(lng.toString());
    const gUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    setGoogleMapsUrl(gUrl);
    setGoogleMapsInput(`${lat}, ${lng}`);
    setExtractionStatus({
      success: true,
      message: `Preset loaded: ${city}, ${state} (${lat}, ${lng})`,
    });
  };

  // Reverse Geocode helper to auto-fill City & State
  const reverseGeocodeCityState = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.address) {
          const city = data.address.city || data.address.town || data.address.village || data.address.municipality || data.address.county || '';
          const state = data.address.state || data.address.region || '';
          if (city) {
            setLocationName(prev => prev || city);
          }
          if (state) {
            setGeneralArea(prev => prev || `${state}, USA`);
          }
        }
      }
    } catch {
      // Non-blocking assistive feature
    }
  };

  // Smart Coordinate / Google Maps link parser
  const handleSmartLocationInput = (rawVal: string) => {
    setGoogleMapsInput(rawVal);
    const text = rawVal.trim();
    if (!text) {
      setExtractionStatus(null);
      return;
    }

    let extractedLat: number | null = null;
    let extractedLng: number | null = null;
    let extractedPlace = '';
    let extractedCity = '';
    let extractedState = '';
    let detectedUrl = '';

    // Check if it's a URL
    if (text.startsWith('http://') || text.startsWith('https://') || text.includes('google.com/maps') || text.includes('maps.app.goo.gl') || text.includes('goo.gl/maps')) {
      detectedUrl = text;

      // Match /@lat,lng
      const atMatch = text.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (atMatch) {
        extractedLat = parseFloat(atMatch[1]);
        extractedLng = parseFloat(atMatch[2]);
      }

      // Match !3dlat!4dlng
      if (extractedLat === null) {
        const dMatch = text.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
        if (dMatch) {
          extractedLat = parseFloat(dMatch[1]);
          extractedLng = parseFloat(dMatch[2]);
        }
      }

      // Match query params: q=lat,lng or query=lat,lng or ll=lat,lng or destination=lat,lng
      if (extractedLat === null) {
        const qMatch = text.match(/[?&](?:q|query|ll|daddr|destination)=(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/);
        if (qMatch) {
          extractedLat = parseFloat(qMatch[1]);
          extractedLng = parseFloat(qMatch[2]);
        }
      }

      // Place Name in URL: /place/Name/
      const placeMatch = text.match(/\/place\/([^/@?]+)/);
      if (placeMatch) {
        try {
          const rawName = decodeURIComponent(placeMatch[1].replace(/\+/g, ' ')).trim();
          if (rawName) {
            const parts = rawName.split(',').map(p => p.trim());
            if (parts.length > 1) {
              extractedPlace = parts[0];
              extractedCity = parts[0];
              extractedState = parts[1].replace(/\d+/g, '').trim();
            } else {
              extractedPlace = rawName;
            }
          }
        } catch {}
      }
    }

    // Decimal coordinates: "34.8697, -111.7610" or "34.8697 -111.7610"
    if (extractedLat === null) {
      const decMatch = text.match(/^(-?\d{1,2}\.\d+)[,\s]+(-?\d{1,3}\.\d+)$/);
      if (decMatch) {
        const lat = parseFloat(decMatch[1]);
        const lng = parseFloat(decMatch[2]);
        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          extractedLat = lat;
          extractedLng = lng;
        }
      }
    }

    // DMS format: 34°52'11"N 111°45'40"W
    if (extractedLat === null) {
      const dmsMatch = text.match(/(\d+)[°\s]+(\d+)['\s]+([\d.]+)?["\s]*([NSEWnsew])[,\s]+(\d+)[°\s]+(\d+)['\s]+([\d.]+)?["\s]*([NSEWnsew])/i);
      if (dmsMatch) {
        const latDeg = parseFloat(dmsMatch[1]);
        const latMin = parseFloat(dmsMatch[2]);
        const latSec = parseFloat(dmsMatch[3] || '0');
        const latDir = dmsMatch[4].toUpperCase();

        const lngDeg = parseFloat(dmsMatch[5]);
        const lngMin = parseFloat(dmsMatch[6]);
        const lngSec = parseFloat(dmsMatch[7] || '0');
        const lngDir = dmsMatch[8].toUpperCase();

        let lat = latDeg + latMin / 60 + latSec / 3600;
        if (latDir === 'S') lat = -lat;
        let lng = lngDeg + lngMin / 60 + lngSec / 3600;
        if (lngDir === 'W') lng = -lng;

        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          extractedLat = parseFloat(lat.toFixed(5));
          extractedLng = parseFloat(lng.toFixed(5));
        }
      }
    }

    // General pattern match for any coordinates
    if (extractedLat === null) {
      const genMatch = text.match(/(-?\d{1,2}\.\d{3,})[,\s]+(-?\d{1,3}\.\d{3,})/);
      if (genMatch) {
        const lat = parseFloat(genMatch[1]);
        const lng = parseFloat(genMatch[2]);
        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          extractedLat = lat;
          extractedLng = lng;
        }
      }
    }

    if (extractedLat !== null && extractedLng !== null) {
      setLatitude(extractedLat.toString());
      setLongitude(extractedLng.toString());
      const effectiveUrl = detectedUrl || `https://www.google.com/maps/search/?api=1&query=${extractedLat},${extractedLng}`;
      setGoogleMapsUrl(effectiveUrl);

      if (extractedCity) setLocationName(prev => prev || extractedCity);
      if (extractedState) setGeneralArea(prev => prev || `${extractedState}, USA`);
      if (extractedPlace && !title) setTitle(extractedPlace);

      setExtractionStatus({
        success: true,
        message: `✓ Extracted GPS: ${extractedLat.toFixed(5)}, ${extractedLng.toFixed(5)}${extractedCity ? ` (${extractedCity})` : ''}`,
      });
      showToast(`GPS extracted: ${extractedLat.toFixed(4)}, ${extractedLng.toFixed(4)}!`, 'success');

      // Auto-lookup city/state if missing
      reverseGeocodeCityState(extractedLat, extractedLng);
    } else if (detectedUrl) {
      setGoogleMapsUrl(detectedUrl);
      setExtractionStatus({
        success: true,
        message: 'Google Maps link saved! Please confirm or enter the GPS numbers below.',
      });
    } else {
      setExtractionStatus({
        success: false,
        message: 'Could not auto-detect coordinates from input. You can type them into Latitude & Longitude directly.',
      });
    }
  };

  // Open Google Maps search in new tab
  const handleOpenGoogleMapsSearch = () => {
    const query = title || locationName || 'campsite RV spots';
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
  };

  // Use Current GPS Location
  const handleUseCurrentGps = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser.', 'warning');
      return;
    }
    setIsLocatingCurrentGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocatingCurrentGps(false);
        const lat = parseFloat(pos.coords.latitude.toFixed(5));
        const lng = parseFloat(pos.coords.longitude.toFixed(5));
        setLatitude(lat.toString());
        setLongitude(lng.toString());
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
        setGoogleMapsUrl(mapsUrl);
        setGoogleMapsInput(`${lat}, ${lng}`);
        setExtractionStatus({
          success: true,
          message: `✓ Current GPS acquired: ${lat}, ${lng}`,
        });
        showToast('Current GPS coordinates acquired!', 'success');
        reverseGeocodeCityState(lat, lng);
      },
      (err) => {
        setIsLocatingCurrentGps(false);
        console.warn('Geolocation error:', err);
        showToast('Could not access current GPS. Please check browser permissions.', 'warning');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Form Step Validation
  const validateStep = (currentStep: number): boolean => {
    if (currentStep === 1) {
      if (!title.trim()) {
        showToast('Please enter a spot name.', 'warning');
        return false;
      }
    }

    if (currentStep === 2) {
      if (visibility === 'public') {
        if (!submitterEmail.trim()) {
          showToast('Please enter your contact email so our review team can reach you.', 'warning');
          return false;
        }
        if (!submitterEmail.includes('@')) {
          showToast('Please enter a valid email address.', 'warning');
          return false;
        }
      }
      const latNum = parseFloat(latitude);
      const lngNum = parseFloat(longitude);
      if (isNaN(latNum) || isNaN(lngNum) || latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
        showToast('Please enter valid GPS coordinates (Latitude -90 to 90, Longitude -180 to 180).', 'warning');
        return false;
      }
    }

    return true;
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      showToast('Please enter a name for your spot in Step 1.', 'warning');
      setStep(1);
      return;
    }

    if (visibility === 'public' && !submitterEmail.trim()) {
      showToast('Please enter your contact email so our review team can reach you.', 'warning');
      setStep(2);
      return;
    }

    setIsSubmitting(true);

    const lat = parseFloat(latitude) || (34.8697 + (Math.random() - 0.5) * 0.1);
    const lng = parseFloat(longitude) || (-111.7610 + (Math.random() - 0.5) * 0.1);
    const isPublicFree = spotCategory === 'public_free';
    const finalGoogleMapsUrl = googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

    try {
      const newSpot = await submitSpotWithReview(
        {
          hostId: isPublicFree ? 'pipeline-import' : currentUser.id,
          spotType: isPublicFree ? 'public' : 'host',
          googleMapsUrl: finalGoogleMapsUrl,
          _pipeline: isPublicFree ? { land_manager: landManager } : undefined,
          title: title.trim(),
          tagline: tagline.trim() || (isPublicFree
            ? `Free ${landManager} public camping spot in ${locationName || 'the USA'}`
            : `${spaceType.replace('_', ' ')} spot in ${locationName || 'the USA'}`),
          description: description.trim() || (isPublicFree
            ? `Free public camping area on ${landManager} land open for boondocking and RV travelers. Pack it in, pack it out.`
            : `Welcome to our spot. Happy to host fellow RV travelers roaming through our area for free.`),
          locationName: locationName.trim() || (isPublicFree ? 'Scenic Public Lands' : 'Sedona'),
          generalArea: generalArea.trim() || 'Arizona, USA',
          coordinates: [lat, lng],
          photos: photos.length > 0 ? photos : ['/images/real_rv_camping_hero.jpg'],
          spaceType,
          environment,
          rigCompatibility: {
            maxLengthFt,
            maxHeightFt,
            maxWidthFt,
            acceptedTypes,
            accessType,
            surfaceType,
            isLevel,
            turnaroundSpace,
            trailerDisconnectRequired: false,
          },
          amenities: {
            electricity,
            water,
            sewer,
            wifi,
            wifiSpeed: wifi ? (wifiSpeed || 'Cellular data available') : undefined,
            bathroom: false,
            shower: false,
            firePit,
            trash,
            shade: 'partial',
            generatorsAllowed,
            generatorHours: generatorsAllowed ? '10:00 AM - 7:00 PM' : undefined,
            petsAllowed,
            petRestrictions: petsAllowed ? 'Leashed outside' : undefined,
            familyFriendly: true,
            quietSetting: true,
            offGridCapable: isPublicFree || electricity === 'none',
          },
          proximity: {
            fuelNearbyMiles: 5,
            groceriesNearbyMiles: 8,
            rvDumpNearbyMiles: 12,
            attractionNote: isPublicFree
              ? `Scenic public boondocking and recreation area on ${landManager} land`
              : 'Near scenic trails and highways',
          },
          rules: {
            maxStayNights,
            checkInWindow,
            checkOutTime,
            quietHours,
            campfirePolicy,
            childrenAllowed: true,
            extraGuestsAllowed: false,
            hostInteraction: isPublicFree ? 'independent_gate_code' : 'social_loves_to_chat',
          },
          gatekeeping: isPublicFree ? 'any_member' : gatekeeping,
          isFeatured: false,
          status: 'active',
          exactAddressSecret: isPublicFree
            ? (exactAddressSecret || 'Public access via GPS coordinates and public route')
            : (exactAddressSecret || 'Address provided upon stay acceptance'),
          arrivalGateCodeSecret: isPublicFree
            ? (arrivalGateCodeSecret || 'Open public access')
            : (arrivalGateCodeSecret || 'Provided upon stay acceptance'),
        },
        {
          submitterName: submitterName || currentUser.name,
          submitterEmail: submitterEmail || currentUser.email,
          submitterPhone: submitterPhone || currentUser.phone,
          visibility,
          notes: submitterNotes || (isPublicFree ? `Public Free Space (${landManager})` : 'Person-Hosted Spot')
        }
      );

      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
      });

      setSubmittedSpot(newSpot);

      if (visibility === 'public') {
        showToast(
          isPublicFree
            ? 'Public free spot submitted! Forwarded to our ranger verification team for review.'
            : 'Host spot submitted! Details forwarded to our ranger verification team for review.',
          'success'
        );
      } else {
        showToast('Personal spot saved instantly to your private RV map!', 'success');
      }
    } catch (err: any) {
      console.error('Error creating spot:', err);
      showToast('Spot saved locally!', 'info');
    } finally {
      setIsSubmitting(false);
    }
  };

  // SUCCESS CONFIRMATION MODAL
  if (submittedSpot) {
    const isPersonal = submittedSpot.visibility === 'personal';
    const isPublicFree = spotCategory === 'public_free';

    return (
      <div className="max-w-2xl mx-auto px-4 py-12 sm:py-16 animate-fade-in text-foreground">
        <Card className="p-6 sm:p-10 border-border bg-card shadow-xl rounded-3xl text-center space-y-6">
          <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-4 border-emerald-200 shadow-sm">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <Badge
              variant={isPersonal ? 'secondary' : 'sage'}
              className="px-3.5 py-1 text-xs uppercase font-extrabold tracking-wider"
            >
              {isPersonal
                ? '🔒 Personal Private Spot'
                : isPublicFree
                ? '🌲 Public Free Space · Live & In Review'
                : '🏡 Person-Hosted Spot · Forwarded for Review'}
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              {isPersonal
                ? 'Your Personal Spot Is Saved!'
                : isPublicFree
                ? 'Public Free Spot Shared!'
                : 'Host Spot Live & Submitted!'}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              <strong>{submittedSpot.title}</strong> has been saved and added to the community map.
            </p>
          </div>

          {/* Details Box */}
          <div className="p-5 rounded-2xl bg-muted/60 border border-border text-left space-y-3 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-border/60">
              <span className="text-muted-foreground font-semibold">Spot Type:</span>
              <span className="font-bold text-foreground">
                {isPublicFree ? `🌲 Public Free Space (${landManager})` : '🏡 Hosted by a Person'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-border/60">
              <span className="text-muted-foreground font-semibold">Location:</span>
              <span className="font-bold text-foreground">{submittedSpot.locationName}, {submittedSpot.generalArea}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-border/60">
              <span className="text-muted-foreground font-semibold">Coordinates:</span>
              <span className="font-mono font-bold text-foreground">
                {submittedSpot.coordinates[0].toFixed(4)}, {submittedSpot.coordinates[1].toFixed(4)}
              </span>
            </div>
            {submittedSpot.googleMapsUrl && (
              <div className="flex justify-between items-center py-1 border-b border-border/60">
                <span className="text-muted-foreground font-semibold">Google Maps:</span>
                <a
                  href={submittedSpot.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline"
                >
                  <span>Open in Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
            <div className="flex justify-between items-center py-1 border-b border-border/60">
              <span className="text-muted-foreground font-semibold">Visibility:</span>
              <span className="font-bold text-primary capitalize">{submittedSpot.visibility} Listing</span>
            </div>
            {!isPersonal && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 space-y-1">
                <div className="flex items-center gap-1.5 font-extrabold text-xs">
                  <Mail className="w-4 h-4 text-emerald-600" />
                  <span>Submission Forwarded to Review Team</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  A full review packet was forwarded to the CampRoo review rangers.
                  The reviewer will inspect your listing and contact you at <strong>{submitterEmail || currentUser.email}</strong>.
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button
              variant="outdoor"
              size="lg"
              onClick={() => {
                setSelectedSpotId(submittedSpot.id);
                setCurrentView('spot-detail');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4" />
              <span>View Spot Details</span>
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                setCurrentView('my-spots');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center justify-center gap-2"
            >
              <span>My Shared Spots</span>
            </Button>

            <Button
              variant="ghost"
              size="lg"
              onClick={() => {
                setCurrentView('explore');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center justify-center gap-2"
            >
              <Compass className="w-4 h-4" />
              <span>Explore Live Map</span>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8 animate-fade-in text-foreground">
      {/* Wizard Header */}
      <div className="text-center space-y-2">
        <Badge variant="sage" className="uppercase tracking-wider font-extrabold text-[11px]">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          COMMUNITY RV SPOT SHARING · 100% FREE PEER NETWORK
        </Badge>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
          Share an RV Spot
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Share a free public camping spot you discovered (BLM land, USFS National Forest, dispersed boondocking) or offer your private property to host fellow travelers for free.
        </p>
      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3, 4, 5].map(s => (
          <div
            key={s}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              step === s
                ? 'w-12 bg-primary shadow-xs'
                : step > s
                ? 'w-6 bg-primary/50'
                : 'w-6 bg-muted'
            }`}
          />
        ))}
      </div>

      {/* Step Title Pill */}
      <div className="flex items-center justify-center">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Step {step} of 5: {
            step === 1 ? 'Spot Type & Category' :
            step === 2 ? 'Location & Submitter Info' :
            step === 3 ? 'Rig Compatibility & Dimensions' :
            step === 4 ? 'Utilities, Amenities & Photos' :
            'Review & Publish'
          }
        </span>
      </div>

      {/* Main Wizard Card */}
      <Card className="p-4 sm:p-8 border-border bg-card shadow-soft space-y-6">

        {/* STEP 1: SPOT CATEGORY, SHARING MODE & IDENTITY */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-border pb-4">
              <h2 className="text-xl font-extrabold text-foreground">Step 1: Choose Spot Category & Sharing Mode</h2>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">
                Tell us what kind of spot you are sharing so we can show the right options.
              </p>
            </div>

            {/* 1. SPOT CATEGORY: PUBLIC FREE SPACE VS HOSTED BY A PERSON */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground block">
                1. What kind of spot are you sharing? <span className="text-rose-500">*</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* PUBLIC FREE SPACE */}
                <div
                  onClick={() => handleSelectCategory('public_free')}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                    spotCategory === 'public_free'
                      ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20'
                      : 'border-border bg-muted/20 hover:border-muted-foreground/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-extrabold text-sm">
                      <Trees className="w-5 h-5 text-emerald-600" />
                      <span>Public Free Space</span>
                    </div>
                    {spotCategory === 'public_free' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white flex items-center gap-1">
                        <Check className="w-3 h-3" /> Selected
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground font-semibold">100% Free & Open</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    A free camping spot open to the public (BLM land, USFS National Forest, dispersed boondocking, scenic roadside pull-off, or free county park). <strong>No personal host required</strong>; RVers pull up and camp freely.
                  </p>
                </div>

                {/* HOSTED BY A PERSON */}
                <div
                  onClick={() => handleSelectCategory('host_hosted')}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                    spotCategory === 'host_hosted'
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-border bg-muted/20 hover:border-muted-foreground/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-primary font-extrabold text-sm">
                      <Home className="w-5 h-5" />
                      <span>Hosted by a Person (Peer Host)</span>
                    </div>
                    {spotCategory === 'host_hosted' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-primary text-white flex items-center gap-1">
                        <Check className="w-3 h-3" /> Selected
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground font-semibold">Peer Host</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Your private driveway, farm, orchard, ranch, yard, or land offered generously to fellow RVers. Travelers request stays and you coordinate arrival directly.
                  </p>
                </div>
              </div>
            </div>

            {/* PUBLIC LAND MANAGER (If Public Free Space) */}
            {spotCategory === 'public_free' && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                <label className="text-xs font-bold text-emerald-950 dark:text-emerald-200 block">
                  Public Agency / Land Manager:
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'BLM', label: 'BLM (Bureau of Land Management)' },
                    { id: 'USFS', label: 'USFS (U.S. Forest Service)' },
                    { id: 'State Land', label: 'State Public Forest / Park' },
                    { id: 'City/County', label: 'Free Municipal / City Park' },
                    { id: 'Dispersed', label: 'Dispersed Public Space' },
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setLandManager(item.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        landManager === item.id
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-background border-border text-foreground hover:bg-muted'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 2. SHARING VISIBILITY: PUBLIC COMMUNITY VS PERSONAL */}
            <div className="space-y-2 pt-1">
              <label className="text-xs font-bold text-foreground block">
                2. Who should be able to see this spot?
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setVisibility('public')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    visibility === 'public'
                      ? 'border-primary bg-primary/10 ring-1 ring-primary font-bold'
                      : 'border-border bg-card hover:border-muted-foreground/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                      <Globe className="w-4 h-4 text-primary" />
                      <span>Share with CampRoo Community (Public)</span>
                    </div>
                    {visibility === 'public' && <Badge variant="outdoor" className="text-[10px]">Selected</Badge>}
                  </div>
                  <p className="text-[11px] text-muted-foreground font-normal">
                    Visible to all RV travelers on the live map; forwarded to review for quality & verification.
                  </p>
                </div>

                <div
                  onClick={() => setVisibility('personal')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    visibility === 'personal'
                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 ring-1 ring-indigo-500 font-bold'
                      : 'border-border bg-card hover:border-muted-foreground/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      <Lock className="w-4 h-4" />
                      <span>Personal Saved Spot (Private to You)</span>
                    </div>
                    {visibility === 'personal' && <Badge variant="secondary" className="text-[10px]">Selected</Badge>}
                  </div>
                  <p className="text-[11px] text-muted-foreground font-normal">
                    Kept only for your private road trips and secret coordinates. Only visible in your personal map.
                  </p>
                </div>
              </div>
            </div>

            {/* 3. SETTING / SPACE TYPE (Adapts to Public vs Hosted) */}
            <div className="pt-2">
              <label className="text-xs font-bold text-foreground block mb-2">
                3. Setting / Space Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {spotCategory === 'public_free' ? (
                  // PUBLIC FREE SPACE OPTIONS
                  [
                    { type: 'forest_clearing', label: 'USFS / National Forest', desc: 'Pine woods clearing' },
                    { type: 'desert_oasis', label: 'BLM Public Land', desc: 'Desert hardpack & red rock' },
                    { type: 'acreage', label: 'Dispersed Boondocking', desc: 'Wild open terrain' },
                    { type: 'backyard', label: 'Scenic Turnout / Trail', desc: 'Roadside trailhead / pull-off' },
                    { type: 'ranch', label: 'Free City / County Camp', desc: 'Designated municipal free RV pad' },
                    { type: 'vineyard', label: 'Wildlife / State Forest', desc: 'State game or recreation land' },
                  ].map(item => (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => setSpaceType(item.type as SpaceType)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        spaceType === item.type
                          ? 'border-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/50 ring-1 ring-emerald-500 font-bold'
                          : 'border-border bg-card hover:border-muted-foreground/30'
                      }`}
                    >
                      <span className="text-xs font-bold text-foreground block">{item.label}</span>
                      <span className="text-[10px] text-muted-foreground mt-0.5 block">{item.desc}</span>
                    </button>
                  ))
                ) : (
                  // HOSTED BY A PERSON OPTIONS
                  [
                    { type: 'driveway', label: 'Driveway', desc: 'Paved or gravel pad' },
                    { type: 'farm', label: 'Farm / Orchard', desc: 'Pasture or farm pad' },
                    { type: 'acreage', label: 'Private Land', desc: 'Rural homestead / woods' },
                    { type: 'backyard', label: 'Yard / Meadow', desc: 'Quiet grassy lawn' },
                    { type: 'desert_oasis', label: 'Desert Oasis', desc: 'Scenic desert hardpack' },
                    { type: 'vineyard', label: 'Vineyard', desc: 'Winery / orchard parcel' },
                    { type: 'forest_clearing', label: 'Forest Clearing', desc: 'Pine woods clearing' },
                    { type: 'ranch', label: 'Ranch', desc: 'Open country horse ranch' },
                  ].map(item => (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => setSpaceType(item.type as SpaceType)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        spaceType === item.type
                          ? 'border-primary bg-primary/10 ring-1 ring-primary font-bold'
                          : 'border-border bg-card hover:border-muted-foreground/30'
                      }`}
                    >
                      <span className="text-xs font-bold text-foreground block">{item.label}</span>
                      <span className="text-[10px] text-muted-foreground mt-0.5 block">{item.desc}</span>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* 4. TITLE & DESCRIPTION */}
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  Spot Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder={
                    spotCategory === 'public_free'
                      ? 'e.g. Dog Valley USFS Dispersed, Red Rock BLM Gateway...'
                      : 'e.g. Desert Roo Oasis, Juniper Ridge Driveway...'
                  }
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full p-3 rounded-xl border border-input bg-background text-xs font-semibold text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1">Short Tagline</label>
                <input
                  type="text"
                  placeholder={
                    spotCategory === 'public_free'
                      ? 'e.g. Scenic free boondocking with dark night skies and level clearing'
                      : 'e.g. Quiet level gravel pad with 30A power and mountain views'
                  }
                  value={tagline}
                  onChange={e => setTagline(e.target.value)}
                  className="w-full p-3 rounded-xl border border-input bg-background text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  {spotCategory === 'public_free' ? 'Description & Driving Access' : 'Description & Host Story'}
                </label>
                <textarea
                  rows={3}
                  placeholder={
                    spotCategory === 'public_free'
                      ? 'Describe the campsite, cell signal, road condition (gravel/dirt/washboard), and what RVers should expect...'
                      : 'Describe your space, rig approach notes, and what travelers can expect...'
                  }
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full p-3 rounded-xl border border-input bg-background text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-none leading-relaxed"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: SUBMITTER CONTACT & LOCATION (WITH GOOGLE MAPS SMART AUTO-FILL) */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-border pb-4">
              <h2 className="text-xl font-extrabold text-foreground">Step 2: Submitter Contact & Location</h2>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">
                Paste a Google Maps link or enter coordinates to auto-fill the spot location instantly!
              </p>
            </div>

            {/* Submitter Contact Section */}
            <div className="p-5 rounded-2xl bg-muted/40 border border-border space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xs text-foreground">
                  <User className="w-4 h-4 text-primary" />
                  <span>
                    {spotCategory === 'public_free'
                      ? 'Community Scout Contact (Used for Review & Verification)'
                      : 'Host Contact Information'}
                  </span>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {visibility === 'public' ? 'Required for Review' : 'Personal Records'}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-foreground block mb-1">Your Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Maya Lin"
                    value={submitterName}
                    onChange={e => setSubmitterName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-input bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-foreground block mb-1">
                    Your Contact Email {visibility === 'public' && <span className="text-rose-500">*</span>}
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. traveler@example.com"
                    value={submitterEmail}
                    onChange={e => setSubmitterEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-input bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-foreground block mb-1">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    placeholder="e.g. +1 (555) 019-2834"
                    value={submitterPhone}
                    onChange={e => setSubmitterPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-input bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {visibility === 'public' && (
                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>
                    Submissions are forwarded to our ranger verification team for review & verification.
                  </span>
                </p>
              )}
            </div>

            {/* SMART GOOGLE MAPS & COORDINATES AUTO-FILL BOX */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-blue-50/80 via-card to-indigo-50/50 dark:from-blue-950/30 dark:via-card dark:to-indigo-950/20 border-2 border-blue-500/30 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-extrabold text-sm">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <span>Smart Location Auto-Fill: Google Maps Link or GPS Coordinates</span>
                </div>
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 text-[10px] w-fit">
                  Instant GPS Extraction
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Paste any Google Maps link (from browser or share button) or raw coordinates (e.g. <code>34.8697, -111.7610</code>). We will automatically extract the GPS coordinates and location!
              </p>

              {/* Main Smart Input Bar */}
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Paste Google Maps link (https://maps.google.com/...) or GPS coords (34.8697, -111.7610)"
                  value={googleMapsInput}
                  onChange={e => handleSmartLocationInput(e.target.value)}
                  className="w-full p-3.5 pr-24 rounded-2xl border-2 border-blue-200 dark:border-blue-800 bg-background text-xs font-semibold text-foreground shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-muted-foreground/60"
                />
                {googleMapsInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setGoogleMapsInput('');
                      setExtractionStatus(null);
                    }}
                    className="absolute right-3 px-2 py-1 text-[11px] font-bold text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Extraction Feedback Pill */}
              {extractionStatus && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 border animate-fade-in ${
                    extractionStatus.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-300 font-bold'
                      : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-800 dark:text-amber-300'
                  }`}
                >
                  {extractionStatus.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Info className="w-4 h-4 text-amber-600 shrink-0" />
                  )}
                  <span className="flex-1">{extractionStatus.message}</span>
                </div>
              )}

              {/* Action Buttons: Search on Google Maps + Current GPS */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleOpenGoogleMapsSearch}
                  className="flex items-center gap-1.5 text-xs font-bold border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-blue-700 dark:text-blue-300"
                >
                  <Search className="w-3.5 h-3.5 text-blue-600" />
                  <span>Search Spot in Google Maps ↗</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleUseCurrentGps}
                  disabled={isLocatingCurrentGps}
                  className="flex items-center gap-1.5 text-xs font-bold border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
                >
                  {isLocatingCurrentGps ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                      <span>Acquiring GPS...</span>
                    </>
                  ) : (
                    <>
                      <Compass className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Use My Current GPS</span>
                    </>
                  )}
                </Button>

                {latitude && longitude && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 py-1"
                  >
                    <span>Verify Pin on Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* Helper tip */}
              <p className="text-[11px] text-muted-foreground/80 leading-relaxed border-t border-blue-100 dark:border-blue-950/50 pt-2">
                💡 <strong>How to get Google Maps link:</strong> On Google Maps on phone or desktop, search for the campsite or tap & hold anywhere on the map, click <strong>Share</strong> → <strong>Copy link</strong>, and paste it here!
              </p>
            </div>

            {/* Location Details (Auto-filled or fine-tuned) */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">City / Region (Public)</label>
                  <input
                    type="text"
                    placeholder="e.g. Sedona, Moab, Bend..."
                    value={locationName}
                    onChange={e => setLocationName(e.target.value)}
                    className="w-full p-3 rounded-xl border border-input bg-background text-xs font-semibold text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">State / US Territory (Public)</label>
                  <input
                    type="text"
                    placeholder="e.g. Arizona, Utah, Oregon..."
                    value={generalArea}
                    onChange={e => setGeneralArea(e.target.value)}
                    className="w-full p-3 rounded-xl border border-input bg-background text-xs font-semibold text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Quick Preset Location helper */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-muted-foreground text-[11px] font-semibold">Quick US Presets:</span>
                {[
                  { city: 'Sedona', state: 'Arizona, USA', lat: 34.8697, lng: -111.7610 },
                  { city: 'Moab', state: 'Utah, USA', lat: 38.5733, lng: -109.5498 },
                  { city: 'Bend', state: 'Oregon, USA', lat: 44.0582, lng: -121.3153 },
                  { city: 'Bozeman', state: 'Montana, USA', lat: 45.6770, lng: -111.0429 },
                  { city: 'Austin', state: 'Texas, USA', lat: 30.2672, lng: -97.7431 },
                ].map(p => (
                  <button
                    key={p.city}
                    type="button"
                    onClick={() => handleSelectPresetLocation(p.city, p.state, p.lat, p.lng)}
                    className="px-2.5 py-1 rounded-full bg-muted hover:bg-muted/80 text-[10px] font-bold text-foreground border border-border"
                  >
                    📍 {p.city}, {p.state.split(',')[0]}
                  </button>
                ))}
              </div>

              {/* Coordinates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                    GPS Latitude <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={latitude}
                    onChange={e => {
                      setLatitude(e.target.value);
                      setGoogleMapsUrl(`https://www.google.com/maps/search/?api=1&query=${e.target.value},${longitude}`);
                    }}
                    placeholder="e.g. 34.8697"
                    className="w-full p-2.5 rounded-xl border border-input bg-background text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                    GPS Longitude <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={longitude}
                    onChange={e => {
                      setLongitude(e.target.value);
                      setGoogleMapsUrl(`https://www.google.com/maps/search/?api=1&query=${latitude},${e.target.value}`);
                    }}
                    placeholder="e.g. -111.7610"
                    className="w-full p-2.5 rounded-xl border border-input bg-background text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Access Notes vs Private Address */}
              {spotCategory === 'public_free' ? (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                    <Navigation className="w-4 h-4" />
                    <span>Public Driving Route & Road Access Notes</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Nearest access road / exit (e.g. Off US-191 Mile 124, west on BLM 340)"
                      value={exactAddressSecret}
                      onChange={e => setExactAddressSecret(e.target.value)}
                      className="p-2.5 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Road clearance notes (e.g. Graded dirt road, 2WD okay dry, washboard)"
                      value={arrivalGateCodeSecret}
                      onChange={e => setArrivalGateCodeSecret(e.target.value)}
                      className="p-2.5 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-xs">
                    <Lock className="w-4 h-4" />
                    <span>Private Address Shield (Only shared after you approve a stay)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Exact street address (e.g. 42 Oak Creek Trail)"
                      value={exactAddressSecret}
                      onChange={e => setExactAddressSecret(e.target.value)}
                      className="p-2.5 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Gate code / Arrival notes (e.g. Code #4921, park by barn)"
                      value={arrivalGateCodeSecret}
                      onChange={e => setArrivalGateCodeSecret(e.target.value)}
                      className="p-2.5 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: RIG COMPATIBILITY */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-border pb-4">
              <h2 className="text-xl font-extrabold text-foreground">Step 3: Rig Compatibility & Dimensions</h2>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">
                Prevent clearance and turnaround issues by specifying what size rigs this spot handles.
              </p>
            </div>

            {/* Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-muted/40 border border-border">
                <label className="text-xs font-bold text-foreground block mb-1">
                  Max RV Length: <span className="text-primary font-extrabold">{maxLengthFt} ft</span>
                </label>
                <input
                  type="range"
                  min={18}
                  max={45}
                  value={maxLengthFt}
                  onChange={e => setMaxLengthFt(Number(e.target.value))}
                  className="w-full accent-primary mt-2"
                />
              </div>

              <div className="p-4 rounded-2xl bg-muted/40 border border-border">
                <label className="text-xs font-bold text-foreground block mb-1">
                  Overhead Clearance: <span className="text-primary font-extrabold">{maxHeightFt} ft</span>
                </label>
                <input
                  type="range"
                  min={10}
                  max={14.5}
                  step={0.5}
                  value={maxHeightFt}
                  onChange={e => setMaxHeightFt(Number(e.target.value))}
                  className="w-full accent-primary mt-2"
                />
              </div>

              <div className="p-4 rounded-2xl bg-muted/40 border border-border">
                <label className="text-xs font-bold text-foreground block mb-1">Access Type</label>
                <select
                  value={accessType}
                  onChange={e => setAccessType(e.target.value as any)}
                  className="w-full mt-1 p-2 rounded-xl bg-background border border-input text-xs font-semibold text-foreground focus:outline-none"
                >
                  <option value="pull_through">Pull-through (Easy, no backing)</option>
                  <option value="back_in">Back-in (Standard approach)</option>
                  <option value="circular_drive">Circular Drive / Loop</option>
                </select>
              </div>
            </div>

            {/* Surface Type */}
            <div className="p-4 rounded-2xl bg-muted/40 border border-border">
              <label className="text-xs font-bold text-foreground block mb-2">Ground Surface</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { id: 'packed_gravel', label: 'Packed Gravel' },
                  { id: 'level_concrete', label: 'Level Concrete' },
                  { id: 'dirt', label: 'Hard-Packed Dirt' },
                  { id: 'desert_hardpack', label: 'Desert Hardpack' },
                  { id: 'firm_grass', label: 'Firm Grass Lawn' },
                ].map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSurfaceType(s.id as any)}
                    className={`p-2 rounded-xl border text-xs font-semibold text-center transition-all ${
                      surfaceType === s.id
                        ? 'border-primary bg-primary/10 text-primary font-bold'
                        : 'border-border bg-card text-muted-foreground'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Accepted RV Types */}
            <div>
              <label className="text-xs font-bold text-foreground block mb-2">Accepted Rig Classes</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.entries(RV_TYPE_LABELS).map(([k, label]) => {
                  const selected = acceptedTypes.includes(k as RVType);
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => toggleAcceptedType(k as RVType)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all ${
                        selected
                          ? 'bg-primary/10 border-primary text-primary font-bold'
                          : 'bg-card border-border text-muted-foreground opacity-70'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1">Turnaround Space & Approach Notes</label>
              <input
                type="text"
                placeholder="e.g. Wide circular turnaround, level crushed gravel pad, trees cleared up to 14ft."
                value={turnaroundSpace}
                onChange={e => setTurnaroundSpace(e.target.value)}
                className="w-full p-3 rounded-xl border border-input bg-background text-xs text-foreground focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* STEP 4: HOOKUPS, AMENITIES & PHOTOS */}
        {step === 4 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-border pb-4">
              <h2 className="text-xl font-extrabold text-foreground">Step 4: Utilities, Amenities & Photos</h2>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">
                Specify available utilities, stay limits, and attach photos.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">Electrical Service</label>
                <select
                  value={electricity}
                  onChange={e => setElectricity(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-input bg-background text-xs font-semibold text-foreground focus:outline-none"
                >
                  <option value="none">None (Dry camping / Boondocking)</option>
                  <option value="15amp">15-Amp Household Plug</option>
                  <option value="30amp">30-Amp Dedicated RV Plug</option>
                  <option value="50amp">50-Amp Heavy RV Plug</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1">Water Hookup</label>
                <select
                  value={water}
                  onChange={e => setWater(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-input bg-background text-xs font-semibold text-foreground focus:outline-none"
                >
                  <option value="none">No Water Available (Pack in)</option>
                  <option value="spigot_fill">Spigot Fill-up Station</option>
                  <option value="potable_hookup">Dedicated Potable Hookup</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1">Max Stay Limit</label>
                <select
                  value={maxStayNights}
                  onChange={e => setMaxStayNights(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-input bg-background text-xs font-semibold text-foreground focus:outline-none"
                >
                  <option value={1}>1 Night (Quick overnight)</option>
                  <option value={2}>2 Nights</option>
                  <option value={3}>3 Nights (Standard peer host)</option>
                  <option value={7}>Up to 7 Nights</option>
                  <option value={14}>14 Nights (Standard BLM / USFS limit)</option>
                  <option value={28}>Up to 28 Nights</option>
                </select>
              </div>
            </div>

            {/* Checkboxes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <label className="p-3 rounded-xl border border-border bg-card flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={wifi}
                  onChange={e => setWifi(e.target.checked)}
                  className="rounded accent-primary"
                />
                <span>Wi-Fi / Cell Coverage</span>
              </label>

              <label className="p-3 rounded-xl border border-border bg-card flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={firePit}
                  onChange={e => setFirePit(e.target.checked)}
                  className="rounded accent-primary"
                />
                <span>Campfire Ring</span>
              </label>

              <label className="p-3 rounded-xl border border-border bg-card flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={petsAllowed}
                  onChange={e => setPetsAllowed(e.target.checked)}
                  className="rounded accent-primary"
                />
                <span>Pets Welcome</span>
              </label>

              <label className="p-3 rounded-xl border border-border bg-card flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={generatorsAllowed}
                  onChange={e => setGeneratorsAllowed(e.target.checked)}
                  className="rounded accent-primary"
                />
                <span>Generators OK</span>
              </label>
            </div>

            {/* Photos Section */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-bold text-foreground block">
                Spot Photos ({photos.length})
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Paste image URL (https://...)"
                  value={newPhotoUrl}
                  onChange={e => setNewPhotoUrl(e.target.value)}
                  className="flex-1 p-2.5 rounded-xl border border-input bg-background text-xs text-foreground focus:outline-none"
                />
                <Button type="button" size="sm" variant="outline" onClick={handleAddPhoto} className="gap-1">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add URL</span>
                </Button>
              </div>

              {/* Quick Preset Photos Helper */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] text-muted-foreground font-semibold">Quick Scenic Presets:</span>
                {[
                  { label: '🌲 Pine Woods', url: '/images/real_rv_camping_hero.jpg' },
                  { label: '⛰️ Bald Mountain', url: '/images/real_bald_mountain.jpg' },
                  { label: '🏜️ Desert Hardpack', url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/67/-TravelTuesday_with_My_Public_Lands_%2824446462030%29.jpg/1280px--TravelTuesday_with_My_Public_Lands_%2824446462030%29.jpg' },
                  { label: '🏕️ Red Rock Canyon', url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/99/-TravelTuesday_with_My_Public_Lands_at_Canyon_Rims_Recreation_Area_SRMA_%2824115137893%29.jpg/1280px--TravelTuesday_with_My_Public_Lands_at_Canyon_Rims_Recreation_Area_SRMA_%2824115137893%29.jpg' },
                ].map(preset => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleAddPresetPhoto(preset.url)}
                    className="px-2.5 py-1 rounded-full bg-muted hover:bg-muted/80 text-[10px] font-bold text-foreground border border-border"
                  >
                    + {preset.label}
                  </button>
                ))}
              </div>

              {/* Photo Thumbnails */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {photos.map((url, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden border border-border h-24 bg-muted">
                    <img src={url} alt={`Spot photo ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/70 hover:bg-rose-600 text-white transition-colors"
                      title="Remove photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: REVIEW & PUBLISH */}
        {step === 5 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-border pb-4">
              <h2 className="text-xl font-extrabold text-foreground">Step 5: Review & Confirmation</h2>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">
                Check your spot details before publishing to the community.
              </p>
            </div>

            {/* Summary Review Card */}
            <div className="p-5 rounded-2xl bg-muted/40 border border-border space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-extrabold text-foreground">{title || 'Untitled Spot'}</h3>
                  <p className="text-xs text-muted-foreground">{locationName || 'Scenic Location'}, {generalArea || 'USA'}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={spotCategory === 'public_free' ? 'sage' : 'outdoor'}>
                    {spotCategory === 'public_free' ? `🌲 Public Free Space (${landManager})` : '🏡 Hosted by a Person'}
                  </Badge>
                  <Badge variant={visibility === 'public' ? 'outdoor' : 'secondary'} className="capitalize">
                    {visibility === 'public' ? '🌐 Public Listing' : '🔒 Personal Spot'}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                <div className="p-2.5 rounded-xl bg-card border border-border">
                  <span className="text-muted-foreground block text-[10px]">Setting</span>
                  <span className="font-bold capitalize">{spaceType.replace('_', ' ')}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-card border border-border">
                  <span className="text-muted-foreground block text-[10px]">Max Rig</span>
                  <span className="font-bold">{maxLengthFt} ft</span>
                </div>
                <div className="p-2.5 rounded-xl bg-card border border-border">
                  <span className="text-muted-foreground block text-[10px]">Electric</span>
                  <span className="font-bold capitalize">{electricity === 'none' ? 'Off-Grid' : electricity}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-card border border-border">
                  <span className="text-muted-foreground block text-[10px]">Max Stay</span>
                  <span className="font-bold">{maxStayNights} Nights</span>
                </div>
              </div>

              {/* Coordinates & Google Maps Link */}
              <div className="p-3.5 rounded-xl bg-card border border-border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                  <div>
                    <span className="font-bold text-foreground">GPS Location: </span>
                    <span className="font-mono text-muted-foreground">{latitude}, {longitude}</span>
                  </div>
                </div>
                {googleMapsUrl && (
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline"
                  >
                    <span>View on Google Maps</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              {/* Submitter & Email Routing Box */}
              <div className="p-4 rounded-xl bg-background border border-border text-xs space-y-2">
                <div className="font-bold text-foreground flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-primary" />
                  <span>Review & Communication Routing:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                  <div>
                    Submitted By: <strong className="text-foreground">{submitterName || 'CampRoo Member'}</strong>
                  </div>
                  <div>
                    Contact Email: <strong className="text-foreground">{submitterEmail || 'Not specified'}</strong>
                  </div>
                  {submitterPhone && (
                    <div>
                      Phone: <strong className="text-foreground">{submitterPhone}</strong>
                    </div>
                  )}
                  <div>
                    Review Destination: <strong className="text-primary">CampRoo Ranger Verification Desk</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Note about review process */}
            {visibility === 'public' ? (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Instant Map Preview + Ranger Review</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Your spot is added <strong>instantly</strong> to your spots list and live preview.
                  Simultaneously, a review dossier is dispatched to our verification rangers, and you will be contacted via email regarding verification.
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold">
                  <Lock className="w-4 h-4 text-indigo-600" />
                  <span>Instant Private Save</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  This spot will be saved immediately to your private personal RV map.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Wizard Footer Navigation */}
        <div className="pt-4 border-t border-border flex items-center justify-between">
          {step > 1 ? (
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={() => setStep(prev => prev - 1)}
              className="flex items-center gap-2"
              disabled={isSubmitting}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <Button
              type="button"
              variant="outdoor"
              size="default"
              onClick={() => {
                if (validateStep(step)) {
                  setStep(prev => prev + 1);
                }
              }}
              className="flex items-center gap-2"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              type="button"
              variant="outdoor"
              size="lg"
              onClick={handlePublish}
              disabled={isSubmitting}
              className="flex items-center gap-2 text-sm font-extrabold shadow-md"
            >
              {isSubmitting ? (
                <span>Submitting & Dispatching Email...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>
                    {visibility === 'public'
                      ? (spotCategory === 'public_free' ? 'Publish Public Free Spot' : 'Publish Host Spot')
                      : 'Save Personal Spot Instantly'}
                  </span>
                </>
              )}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};
