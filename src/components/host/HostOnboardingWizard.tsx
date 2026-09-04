import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import {
  SpaceType,
  EnvironmentType,
  RVType,
  RV_TYPE_LABELS,
  GatekeepingRequirement
} from '../../types';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Slider } from '../ui/slider';
import { Separator } from '../ui/separator';
import {
  Home,
  MapPin,
  Truck,
  Zap,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Camera,
  Flame,
  Dog,
  Lock
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const HostOnboardingWizard: React.FC = () => {
  const { currentUser, createSpot, setCurrentView, setSelectedSpotId } = useApp();
  const { showToast } = useToast();

  const [step, setStep] = useState(1);

  // Form State
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [spaceType, setSpaceType] = useState<SpaceType>('driveway');
  const [environment, setEnvironment] = useState<EnvironmentType>('rural');

  // Location
  const [locationName, setLocationName] = useState('');
  const [generalArea, setGeneralArea] = useState('');
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
  const [turnaroundSpace, setTurnaroundSpace] = useState('Spacious driveway with 60ft circular turning radius.');

  // Amenities
  const [electricity, setElectricity] = useState<'none' | '15amp' | '30amp' | '50amp'>('30amp');
  const [water, setWater] = useState<'potable_hookup' | 'spigot_fill' | 'non_potable' | 'none'>('potable_hookup');
  const [sewer, setSewer] = useState<'full_hookup' | 'dump_station_on_site' | 'nearby_dump' | 'none'>('none');
  const [wifi, setWifi] = useState(true);
  const [wifiSpeed, setWifiSpeed] = useState('50 Mbps Wireless');
  const [firePit, setFirePit] = useState(true);
  const [trash, setTrash] = useState(true);
  const [petsAllowed, setPetsAllowed] = useState(true);
  const [generatorsAllowed, setGeneratorsAllowed] = useState(true);

  // Rules
  const [maxStayNights, setMaxStayNights] = useState(3);
  const [checkInWindow, setCheckInWindow] = useState('2:00 PM - 8:00 PM');
  const [checkOutTime, setCheckOutTime] = useState('11:00 AM');
  const [quietHours, setQuietHours] = useState('10:00 PM - 7:00 AM');
  const [campfirePolicy, setCampfirePolicy] = useState('Allowed in provided fire bowl');

  // Gatekeeping
  const [gatekeeping, setGatekeeping] = useState<GatekeepingRequirement>('verified_id_only');

  // Sample Photos
  const samplePhotos = [
    '/images/desert_spot.jpg',
    '/images/meadow_spot.jpg',
    'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1000&q=80',
  ];

  const toggleAcceptedType = (type: RVType) => {
    if (acceptedTypes.includes(type)) {
      setAcceptedTypes(prev => prev.filter(t => t !== type));
    } else {
      setAcceptedTypes(prev => [...prev, type]);
    }
  };

  const handlePublish = () => {
    const newSpot = createSpot({
      hostId: currentUser.id,
      title: title || 'Peaceful Rover Respite',
      tagline: tagline || 'Clean level RV spot shared with fellow rovers',
      description: description || 'Welcome to our private space. We are happy to host fellow RV travelers roaming through our area for free.',
      locationName: locationName || 'Sedona',
      generalArea: generalArea || 'Arizona, USA',
      coordinates: [34.8697 + (Math.random() - 0.5) * 0.1, -111.761 + (Math.random() - 0.5) * 0.1],
      photos: samplePhotos,
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
        wifiSpeed,
        bathroom: false,
        shower: false,
        firePit,
        trash,
        shade: 'partial',
        generatorsAllowed,
        generatorHours: '10:00 AM - 7:00 PM',
        petsAllowed,
        petRestrictions: 'Leashed outside',
        familyFriendly: true,
        quietSetting: true,
        offGridCapable: false,
      },
      proximity: {
        fuelNearbyMiles: 2,
        groceriesNearbyMiles: 5,
        rvDumpNearbyMiles: 8,
        attractionNote: 'Near scenic BLM trails and highway pass',
      },
      rules: {
        maxStayNights,
        checkInWindow,
        checkOutTime,
        quietHours,
        campfirePolicy,
        childrenAllowed: true,
        extraGuestsAllowed: false,
        hostInteraction: 'social_loves_to_chat',
      },
      gatekeeping,
      isFeatured: false,
      status: 'active',
      exactAddressSecret: exactAddressSecret || '1024 Roamer Way, Desert Pines',
      arrivalGateCodeSecret: arrivalGateCodeSecret || 'ROO-HOST-2026',
    });

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });

    showToast('Your free RV spot is officially live on CampRoo!', 'success');
    setSelectedSpotId(newSpot.id);
    setCurrentView('spot-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in text-foreground">
      {/* Wizard Header */}
      <div className="text-center space-y-2">
        <Badge variant="sage" className="uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          RVERS HELPING RVERS
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
          Have a spot? Share it with an RVer.
        </h1>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          Share your driveway, farm, yard, or rural land for free. You set the rules, vehicle limits, and choose who you welcome.
        </p>
      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3, 4, 5].map(s => (
          <div
            key={s}
            className={`h-2 rounded-full transition-all duration-300 ${
              step === s
                ? 'w-10 bg-primary'
                : step > s
                ? 'w-6 bg-primary/40'
                : 'w-6 bg-muted'
            }`}
          />
        ))}
      </div>

      {/* Main Wizard Card */}
      <Card className="p-6 sm:p-10 border-border bg-card shadow-soft space-y-6">
        {/* STEP 1: SPACE TYPE & IDENTITY */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-border pb-4">
              <h2 className="text-xl font-extrabold text-foreground">Step 1: Your Spot & Setting</h2>
              <p className="text-xs text-muted-foreground font-medium">What type of space are you opening up to fellow rovers?</p>
            </div>

            {/* Space Type Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { type: 'driveway', label: 'Driveway', desc: 'Paved or gravel home driveway' },
                { type: 'farm', label: 'Farm / Orchard', desc: 'Ag pasture or orchard pad' },
                { type: 'acreage', label: 'Private Land', desc: 'Acreage or rural homestead' },
                { type: 'backyard', label: 'Yard / Meadow', desc: 'Quiet grassy or shaded yard' },
                { type: 'desert_oasis', label: 'Desert Oasis', desc: 'Scenic desert or hardpack' },
                { type: 'vineyard', label: 'Vineyard', desc: 'Winery or vineyard parcel' },
                { type: 'forest_clearing', label: 'Forest Clearing', desc: 'Pine woods or mountain glade' },
                { type: 'ranch', label: 'Ranch', desc: 'Open country horse/cattle ranch' },
              ].map(item => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setSpaceType(item.type as SpaceType)}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    spaceType === item.type
                      ? 'border-forest-900 bg-forest-50/80 ring-1 ring-forest-900'
                      : 'border-cream-200 hover:border-cream-300 bg-white'
                  }`}
                >
                  <span className="text-xs font-bold text-forest-950 block">{item.label}</span>
                  <span className="text-[10px] text-cream-900/60 mt-0.5 block">{item.desc}</span>
                </button>
              ))}
            </div>

            {/* Title & Tagline */}
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-bold text-forest-950 block mb-1">Spot Name</label>
                <input
                  type="text"
                  placeholder="e.g. Desert Roo Oasis, Juniper Ridge Pad..."
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full p-3 rounded-xl border border-cream-300 text-xs font-semibold text-forest-950 focus:ring-1 focus:ring-forest-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-forest-950 block mb-1">Short Tagline</label>
                <input
                  type="text"
                  placeholder="e.g. Quiet level gravel pad with 30A power and mountain views"
                  value={tagline}
                  onChange={e => setTagline(e.target.value)}
                  className="w-full p-3 rounded-xl border border-cream-300 text-xs text-forest-950 focus:ring-1 focus:ring-forest-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-forest-950 block mb-1">Host Story & Description</label>
                <textarea
                  rows={4}
                  placeholder="Describe your space, how you got into RVing, and what guests can expect..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full p-3 rounded-xl border border-cream-300 text-xs text-forest-950 focus:ring-1 focus:ring-forest-800 focus:outline-none leading-relaxed"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: LOCATION & PRIVACY */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-cream-100 pb-4">
              <h2 className="text-xl font-extrabold text-forest-950">Step 2: Location & Privacy Shield</h2>
              <p className="text-xs text-cream-900/60 font-medium">
                Public travelers only see your general municipality. Your exact address is guarded.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-forest-950 block mb-1">City / Town (Public)</label>
                <input
                  type="text"
                  placeholder="e.g. Moab, Sedona, Bend..."
                  value={locationName}
                  onChange={e => setLocationName(e.target.value)}
                  className="w-full p-3 rounded-xl border border-cream-300 text-xs font-semibold text-forest-950 focus:ring-1 focus:ring-forest-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1">State / US Region (Public)</label>
                <input
                  type="text"
                  placeholder="e.g. Utah, Arizona, Colorado, Oregon..."
                  value={generalArea}
                  onChange={e => setGeneralArea(e.target.value)}
                  className="w-full p-3 rounded-xl border border-input bg-background text-xs font-semibold text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
            </div>

            {/* Secret Private Address Section */}
            <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-4">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <Lock className="w-4 h-4 text-amber-700" />
                <span>Private Information (Only released once you accept a stay)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-amber-950 block mb-1">Exact Street Address</label>
                  <input
                    type="text"
                    placeholder="e.g. 44-B Palm Grove Lane, Gate 2"
                    value={exactAddressSecret}
                    onChange={e => setExactAddressSecret(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-amber-300 bg-white text-xs font-medium text-forest-950 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-amber-950 block mb-1">Gate Code / Arrival Note</label>
                  <input
                    type="text"
                    placeholder="e.g. ROO-4921 (Pad is behind the barn)"
                    value={arrivalGateCodeSecret}
                    onChange={e => setArrivalGateCodeSecret(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-amber-300 bg-white text-xs font-medium text-forest-950 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: RIG COMPATIBILITY */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-cream-100 pb-4">
              <h2 className="text-xl font-extrabold text-forest-950">Step 3: Rig Compatibility & Dimensions</h2>
              <p className="text-xs text-cream-900/60 font-medium">
                Prevent clearance issues by specifying exactly what your driveway handles.
              </p>
            </div>

            {/* Dimensions Slider */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-cream-50 border border-cream-200">
                <label className="text-xs font-bold text-forest-950 block mb-1">
                  Max RV Length: <span className="text-forest-700 font-extrabold">{maxLengthFt} ft</span>
                </label>
                <input
                  type="range"
                  min={18}
                  max={45}
                  value={maxLengthFt}
                  onChange={e => setMaxLengthFt(Number(e.target.value))}
                  className="w-full accent-forest-800 mt-2"
                />
              </div>

              <div className="p-4 rounded-2xl bg-cream-50 border border-cream-200">
                <label className="text-xs font-bold text-forest-950 block mb-1">
                  Max Overhead Clearance: <span className="text-forest-700 font-extrabold">{maxHeightFt} ft</span>
                </label>
                <input
                  type="range"
                  min={10}
                  max={14.5}
                  step={0.5}
                  value={maxHeightFt}
                  onChange={e => setMaxHeightFt(Number(e.target.value))}
                  className="w-full accent-forest-800 mt-2"
                />
              </div>

              <div className="p-4 rounded-2xl bg-cream-50 border border-cream-200">
                <label className="text-xs font-bold text-forest-950 block mb-1">
                  Access Type
                </label>
                <select
                  value={accessType}
                  onChange={e => setAccessType(e.target.value as any)}
                  className="w-full mt-1 p-2 rounded-xl bg-white border border-cream-300 text-xs font-semibold text-forest-950"
                >
                  <option value="pull_through">Pull-through (No backing)</option>
                  <option value="back_in">Back-in (Easy approach)</option>
                  <option value="circular_drive">Circular Driveway</option>
                </select>
              </div>
            </div>

            {/* Accepted RV Types */}
            <div>
              <label className="text-xs font-bold text-forest-950 block mb-2">Accepted Rig Classes</label>
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
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                          : 'bg-white border-cream-200 text-cream-400 opacity-60'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-forest-950 block mb-1">Turnaround & Ground Surface Notes</label>
              <input
                type="text"
                placeholder="e.g. Level crushed granite, 80ft turning radius around the barn."
                value={turnaroundSpace}
                onChange={e => setTurnaroundSpace(e.target.value)}
                className="w-full p-3 rounded-xl border border-cream-300 text-xs text-forest-950 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* STEP 4: HOOKUPS & POLICIES */}
        {step === 4 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-cream-100 pb-4">
              <h2 className="text-xl font-extrabold text-forest-950">Step 4: Hookups & House Policies</h2>
              <p className="text-xs text-cream-900/60 font-medium">What power and water services do you offer?</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-forest-950 block mb-1">Electrical Service</label>
                <select
                  value={electricity}
                  onChange={e => setElectricity(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-cream-300 text-xs font-semibold text-forest-950"
                >
                  <option value="none">None (Off-grid / Boondocking)</option>
                  <option value="15amp">15-Amp Household Plug</option>
                  <option value="30amp">30-Amp Dedicated RV Plug</option>
                  <option value="50amp">50-Amp Heavy RV Service</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-forest-950 block mb-1">Water Hookup</label>
                <select
                  value={water}
                  onChange={e => setWater(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-cream-300 text-xs font-semibold text-forest-950"
                >
                  <option value="potable_hookup">Dedicated Potable Hookup</option>
                  <option value="spigot_fill">Spigot Fill-up Station</option>
                  <option value="none">No Water Available</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-forest-950 block mb-1">Maximum Stay Limit</label>
                <select
                  value={maxStayNights}
                  onChange={e => setMaxStayNights(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-cream-300 text-xs font-semibold text-forest-950"
                >
                  <option value={1}>1 Night (Quick transit)</option>
                  <option value={2}>2 Nights</option>
                  <option value={3}>3 Nights (Recommended)</option>
                  <option value={4}>4 Nights</option>
                  <option value={7}>Up to 7 Nights</option>
                </select>
              </div>
            </div>

            {/* Checkboxes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <label className="p-3 rounded-xl border border-cream-200 flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={wifi}
                  onChange={e => setWifi(e.target.checked)}
                  className="rounded accent-forest-800"
                />
                <span>Wi-Fi Available</span>
              </label>

              <label className="p-3 rounded-xl border border-cream-200 flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={firePit}
                  onChange={e => setFirePit(e.target.checked)}
                  className="rounded accent-forest-800"
                />
                <span>Campfire Ring</span>
              </label>

              <label className="p-3 rounded-xl border border-cream-200 flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={petsAllowed}
                  onChange={e => setPetsAllowed(e.target.checked)}
                  className="rounded accent-forest-800"
                />
                <span>Pets Welcome</span>
              </label>

              <label className="p-3 rounded-xl border border-cream-200 flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={generatorsAllowed}
                  onChange={e => setGeneratorsAllowed(e.target.checked)}
                  className="rounded accent-forest-800"
                />
                <span>Generators OK</span>
              </label>
            </div>
          </div>
        )}

        {/* STEP 5: GATEKEEPING & 100% FREE PLEDGE */}
        {step === 5 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-cream-100 pb-4">
              <h2 className="text-xl font-extrabold text-forest-950">Step 5: Who Can Request Your Spot?</h2>
              <p className="text-xs text-cream-900/60 font-medium">Control who is permitted to send you stay inquiries.</p>
            </div>

            <div className="space-y-3">
              {[
                {
                  key: 'verified_id_only',
                  title: 'Verified Members Only (Recommended)',
                  desc: 'Requires verified phone, email, and ID document verification before requesting.',
                },
                {
                  key: 'experienced_rvers_only',
                  title: 'Experienced RVers With Previous Positive Stays',
                  desc: 'Only members who have completed at least 1 verified CampRoo stay and received a positive review.',
                },
                {
                  key: 'any_member',
                  title: 'Any Registered CampRoo Member',
                  desc: 'Open to all registered members in good standing.',
                },
              ].map(opt => (
                <label
                  key={opt.key}
                  className={`p-4 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                    gatekeeping === opt.key
                      ? 'border-forest-900 bg-forest-50/70 ring-1 ring-forest-900'
                      : 'border-cream-200 bg-white hover:border-cream-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="gatekeeping"
                    value={opt.key}
                    checked={gatekeeping === opt.key}
                    onChange={() => setGatekeeping(opt.key as GatekeepingRequirement)}
                    className="mt-1 accent-forest-800"
                  />
                  <div>
                    <span className="text-sm font-bold text-forest-950 block">{opt.title}</span>
                    <span className="text-xs text-cream-900/70 mt-0.5 block">{opt.desc}</span>
                  </div>
                </label>
              ))}
            </div>

            {/* Peer-to-Peer Free Hospitality Notice */}
            <div className="p-5 rounded-3xl bg-forest-900 text-cream-50 space-y-3 shadow-soft">
              <div className="flex items-center gap-2 text-roo-400 font-extrabold text-sm">
                <Sparkles className="w-4 h-4" />
                <span>The CampRoo Community Pledge</span>
              </div>
              <p className="text-xs text-forest-100 leading-relaxed">
                By publishing your spot, you agree that stays are <strong>100% free</strong>. You will never charge nightly rates or commercial cleaning fees. You are helping a fellow rover on their journey, building a network of trust that you can also enjoy when roaming yourself.
              </p>
            </div>
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
              onClick={() => setStep(prev => prev + 1)}
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
              className="flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Publish Free Spot</span>
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};
