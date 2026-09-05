import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { AuthModal } from '../common/AuthModal';
import { RVType, RV_TYPE_LABELS } from '../../types';
import {
  ShieldCheck,
  Truck,
  MapPin,
  Calendar,
  Mail,
  Heart,
  LogOut,
  Sparkles,
  Edit3,
  Check,
  X,
  Compass,
  User as UserIcon,
  MessageSquare,
} from 'lucide-react';

export const UserProfilePage: React.FC = () => {
  const {
    currentUser,
    savedSpotIds,
    setCurrentView,
    logout,
    isAuthenticated,
    updateUserProfile
  } = useApp();

  const { showToast } = useToast();

  // Auth modal controls for guests
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editBio, setEditBio] = useState(currentUser?.bio || '');
  const [editHomeRegion, setEditHomeRegion] = useState(currentUser?.homeRegion || 'United States');
  const [editYearsRVing, setEditYearsRVing] = useState(currentUser?.yearsRVing || 1);
  const [editRigType, setEditRigType] = useState<RVType>(currentUser?.rig?.type || 'class_c');
  const [editRigMakeModel, setEditRigMakeModel] = useState(currentUser?.rig?.makeModel || '');
  const [editRigLengthFt, setEditRigLengthFt] = useState(currentUser?.rig?.lengthFt || 25);
  const [editRigYear, setEditRigYear] = useState(currentUser?.rig?.year || 2023);

  const handleStartEdit = () => {
    setEditName(currentUser.name);
    setEditBio(currentUser.bio || '');
    setEditHomeRegion(currentUser.homeRegion || 'United States');
    setEditYearsRVing(currentUser.yearsRVing || 1);
    setEditRigType(currentUser.rig?.type || 'class_c');
    setEditRigMakeModel(currentUser.rig?.makeModel || '');
    setEditRigLengthFt(currentUser.rig?.lengthFt || 25);
    setEditRigYear(currentUser.rig?.year || 2023);
    setIsEditing(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      showToast('Name cannot be empty', 'error');
      return;
    }

    updateUserProfile({
      name: editName.trim(),
      bio: editBio.trim(),
      homeRegion: editHomeRegion.trim(),
      yearsRVing: Number(editYearsRVing),
      rig: {
        type: editRigType,
        makeModel: editRigMakeModel.trim() || 'Custom Rig',
        lengthFt: Number(editRigLengthFt) || 25,
        year: Number(editRigYear) || 2023,
      }
    });

    setIsEditing(false);
    showToast('Profile updated successfully! ✨', 'success');
  };

  // 1. GUEST VIEW (When visitor has not signed in)
  if (!isAuthenticated || currentUser.id === 'guest') {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6 animate-fade-in">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-dark-200/90 shadow-soft text-center space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-roo-50 border border-roo-100 flex items-center justify-center mx-auto text-roo-600 shadow-xs">
            <UserIcon className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black text-dark-950">
              Welcome to CampRoo
            </h1>
            <p className="text-xs sm:text-sm text-dark-500 max-w-md mx-auto leading-relaxed">
              Sign in or create a free account to personalize your RV rig profile, save your favorite public land havens, and coordinate stays with hosts.
            </p>
          </div>

          {/* Quick Sign In / Sign Up CTAs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => {
                setAuthMode('signin');
                setAuthModalOpen(true);
              }}
              className="w-full py-3 px-4 rounded-2xl bg-white border border-dark-300 hover:border-dark-400 text-dark-900 text-xs font-black shadow-xs active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-roo-500" />
              <span>Sign In</span>
            </button>

            <button
              onClick={() => {
                setAuthMode('signup');
                setAuthModalOpen(true);
              }}
              className="w-full py-3 px-4 rounded-2xl bg-roo-500 hover:bg-roo-600 text-white text-xs font-black shadow-md shadow-roo-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Truck className="w-4 h-4" />
              <span>Create Free Account</span>
            </button>
          </div>

          {/* Member Benefits List */}
          <div className="pt-4 border-t border-dark-100 text-left space-y-3">
            <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-dark-600">
              Free Membership Perks
            </h3>
            <div className="grid grid-cols-1 gap-2.5">
              <div className="p-3 rounded-2xl bg-dark-50/70 border border-dark-100 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                  <Heart className="w-4 h-4 fill-rose-500" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-dark-900">Save Liked Havens</h4>
                  <p className="text-[11px] text-dark-500">Bookmark 9,780+ free spots across the US with 1-tap GPS directions.</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-dark-50/70 border border-dark-100 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-roo-50 text-roo-600 flex items-center justify-center shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-dark-900">Custom Rig Clearance Matching</h4>
                  <p className="text-[11px] text-dark-500">Save your rig length & type so you only see spots that fit your setup.</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-dark-50/70 border border-dark-100 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-dark-900">Direct Chat with Hosts</h4>
                  <p className="text-[11px] text-dark-500">Privately message driveway and ranch hosts to confirm gates and hookups.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Mission Link */}
          <div className="pt-2 text-center">
            <button
              onClick={() => {
                setCurrentView('about');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-xs font-bold text-roo-600 hover:text-roo-700 hover:underline flex items-center justify-center gap-1 mx-auto"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Read About CampRoo's Mission</span>
            </button>
          </div>
        </div>

        {/* Auth Modal for Guests */}
        <AuthModal
          isOpen={authModalOpen}
          initialMode={authMode}
          onClose={() => setAuthModalOpen(false)}
        />
      </div>
    );
  }

  // 2. AUTHENTICATED MEMBER VIEW
  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-5 animate-fade-in">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-dark-200/90 shadow-soft space-y-6">
        {/* Profile Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <img
                src={currentUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=0284c7&color=fff&bold=true`}
                alt={currentUser.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-2 ring-dark-200 shadow-xs"
              />
              {currentUser.verifications?.idDocument && (
                <div
                  className="absolute -bottom-1 -right-1 bg-emerald-600 text-white p-1 rounded-full shadow-xs"
                  title="Verified RV Member"
                >
                  <ShieldCheck className="w-4 h-4" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-dark-950 truncate">
                  {currentUser.name}
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-roo-50 text-roo-700 text-[10px] font-black uppercase tracking-wide">
                  {currentUser.role || 'Traveler'}
                </span>
              </div>

              <p className="text-xs font-semibold text-dark-500 flex items-center gap-1 truncate">
                <Mail className="w-3.5 h-3.5 text-dark-400 shrink-0" />
                <span>{currentUser.email || 'roamer@camproo.com'}</span>
              </p>

              <p className="text-xs font-semibold text-dark-500 flex items-center gap-1 truncate">
                <MapPin className="w-3.5 h-3.5 text-roo-500 shrink-0" />
                <span>{currentUser.homeRegion || 'United States'}</span>
                <span className="text-dark-300">·</span>
                <Calendar className="w-3.5 h-3.5 text-dark-400 shrink-0" />
                <span>Joined {currentUser.joinedYear || 2026}</span>
              </p>
            </div>
          </div>

          {/* Edit Profile Toggle Button */}
          {!isEditing && (
            <button
              onClick={handleStartEdit}
              className="p-2 rounded-xl bg-dark-50 hover:bg-dark-100 border border-dark-200 text-dark-700 hover:text-dark-950 transition-colors shrink-0"
              title="Edit Profile & Rig"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* User Bio */}
        {currentUser.bio && !isEditing && (
          <p className="text-xs text-dark-600 leading-relaxed bg-dark-50/70 p-3.5 rounded-2xl border border-dark-100">
            "{currentUser.bio}"
          </p>
        )}

        {/* EDIT PROFILE FORM MODAL / INLINE */}
        {isEditing && (
          <form onSubmit={handleSaveProfile} className="p-4 sm:p-5 rounded-2xl bg-dark-50 border border-dark-200 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-dark-200 pb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-dark-900 flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-roo-500" />
                <span>Edit Roamer Profile</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-dark-400 hover:text-dark-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-dark-700 mb-1">Display Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-dark-200 focus:outline-none focus:ring-2 focus:ring-roo-500 text-dark-900 font-semibold"
                  placeholder="Your Name / Trail Handle"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-dark-700 mb-1">Home Region / State</label>
                <input
                  type="text"
                  value={editHomeRegion}
                  onChange={(e) => setEditHomeRegion(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-dark-200 focus:outline-none focus:ring-2 focus:ring-roo-500 text-dark-900 font-semibold"
                  placeholder="e.g. Flagstaff, AZ or Pacific Northwest"
                />
              </div>

              <div>
                <label className="block font-bold text-dark-700 mb-1">Bio / Travel Style</label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-dark-200 focus:outline-none focus:ring-2 focus:ring-roo-500 text-dark-900 font-normal leading-relaxed resize-none"
                  placeholder="Tell fellow hosts and travelers a bit about your road adventures..."
                />
              </div>

              {/* Rig Settings */}
              <div className="pt-2 border-t border-dark-200 space-y-3">
                <h4 className="text-[11px] font-black uppercase text-dark-700 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-roo-500" />
                  <span>RV Rig Specifications</span>
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-dark-700 mb-1">Rig Type</label>
                    <select
                      value={editRigType}
                      onChange={(e) => setEditRigType(e.target.value as RVType)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-dark-200 focus:outline-none focus:ring-2 focus:ring-roo-500 text-dark-900 font-semibold"
                    >
                      {Object.entries(RV_TYPE_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-dark-700 mb-1">Length (ft)</label>
                    <input
                      type="number"
                      min={10}
                      max={55}
                      value={editRigLengthFt}
                      onChange={(e) => setEditRigLengthFt(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-dark-200 focus:outline-none focus:ring-2 focus:ring-roo-500 text-dark-900 font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-dark-700 mb-1">Make & Model</label>
                    <input
                      type="text"
                      value={editRigMakeModel}
                      onChange={(e) => setEditRigMakeModel(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-dark-200 focus:outline-none focus:ring-2 focus:ring-roo-500 text-dark-900 font-semibold"
                      placeholder="e.g. Winnebago Ekko"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-dark-700 mb-1">Model Year</label>
                    <input
                      type="number"
                      min={1970}
                      max={2026}
                      value={editRigYear}
                      onChange={(e) => setEditRigYear(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-dark-200 focus:outline-none focus:ring-2 focus:ring-roo-500 text-dark-900 font-semibold"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 rounded-xl border border-dark-200 text-dark-600 hover:bg-dark-100 text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-roo-500 hover:bg-roo-600 text-white text-xs font-black shadow-xs transition-all flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        )}

        {/* Quick Stats Pill */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            onClick={() => {
              setCurrentView('trips');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="p-3.5 rounded-2xl bg-dark-50/80 hover:bg-dark-100/80 border border-dark-200/80 flex items-center gap-3 transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
            </div>
            <div>
              <span className="text-xs font-black text-dark-950 block">
                {savedSpotIds.length} Saved
              </span>
              <span className="text-[11px] text-dark-500 font-medium block">
                Liked Havens
              </span>
            </div>
          </button>

          <button
            onClick={() => {
              setCurrentView('messages');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="p-3.5 rounded-2xl bg-dark-50/80 hover:bg-dark-100/80 border border-dark-200/80 flex items-center gap-3 transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-roo-50 text-roo-600 flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5 text-roo-500" />
            </div>
            <div>
              <span className="text-xs font-black text-dark-950 block">
                Community Inbox
              </span>
              <span className="text-[11px] text-dark-500 font-medium block">
                Messages
              </span>
            </div>
          </button>
        </div>

        {/* Rig Information Card */}
        {!isEditing && (
          <div className="pt-4 border-t border-dark-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-roo-600" />
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-dark-700">
                  RV Rig Details
                </h2>
              </div>
              <button
                onClick={handleStartEdit}
                className="text-[11px] font-bold text-roo-600 hover:text-roo-700 hover:underline"
              >
                Edit Rig →
              </button>
            </div>
            <div className="p-3.5 rounded-2xl bg-dark-50 border border-dark-200/70 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-dark-950">
                  {currentUser.rig?.lengthFt || 25}ft {currentUser.rig?.makeModel || 'Travel Rig'}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white border border-dark-200 text-dark-700 text-[10px] font-bold capitalize">
                  {(currentUser.rig?.type || 'RV').replace('_', ' ')}
                </span>
              </div>
              <p className="text-[11px] text-dark-500">
                Model Year {currentUser.rig?.year || 2023} · {currentUser.yearsRVing || 1} years RVing experience
              </p>
            </div>
          </div>
        )}

        {/* Buy Me a Coffee Support Box */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-base">☕</span>
              <span className="text-xs font-black text-amber-950">Support CampRoo</span>
            </div>
            <p className="text-[11px] text-amber-800/80 leading-snug">
              Keep verified free haven data 100% free and ad-free for everyone.
            </p>
          </div>
          <a
            href="https://buymeacoffee.com/camproo"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black shadow-xs active:scale-95 transition-all shrink-0"
          >
            Buy Coffee
          </a>
        </div>

        {/* Actions */}
        <div className="pt-2 flex items-center gap-3">
          <button
            onClick={() => {
              setCurrentView('about');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex-1 py-2.5 px-4 rounded-xl border border-dark-200 text-dark-700 hover:bg-dark-50 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Compass className="w-3.5 h-3.5 text-roo-500" />
            <span>Our Mission</span>
          </button>

          <button
            onClick={() => logout()}
            className="flex-1 py-2.5 px-4 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

