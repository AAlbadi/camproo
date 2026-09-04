import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  Star,
  Truck,
  MapPin,
  Calendar,
  Sparkles,
  Compass,
  Home,
  CheckCircle2
} from 'lucide-react';

export const UserProfilePage: React.FC = () => {
  const { currentUser, reviews, users } = useApp();

  const userReviews = reviews.filter(
    r => r.travelerId === currentUser.id || r.hostId === currentUser.id
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-cream-200 shadow-soft space-y-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          <div className="relative">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover ring-4 ring-forest-700/20"
            />
            {currentUser.verifications.idDocument && (
              <div className="absolute -bottom-2 -right-2 bg-emerald-600 text-white p-1.5 rounded-full shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
            )}
          </div>

          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-forest-950">{currentUser.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-forest-100 text-forest-800 text-xs font-bold capitalize">
                {currentUser.role}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-cream-900/60 font-medium flex items-center justify-center sm:justify-start gap-1">
              <MapPin className="w-4 h-4 text-roo-500" />
              <span>{currentUser.homeRegion} · Member since {currentUser.joinedYear}</span>
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2 text-xs font-bold text-forest-900">
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>{currentUser.rating}</span>
                <span className="text-cream-900/50 font-medium">({currentUser.reviewCount} reviews)</span>
              </span>
              <span>·</span>
              <span>{currentUser.tripsCompleted} trips completed</span>
              <span>·</span>
              <span>{currentUser.spotsHosted} spots hosted</span>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="pt-4 border-t border-cream-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-forest-800 mb-2">Member Bio</h3>
          <p className="text-sm text-cream-900/80 leading-relaxed">
            {currentUser.bio}
          </p>
        </div>

        {/* Rig Details & RV Life */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-cream-50 border border-cream-200/80 flex items-start gap-3">
            <Truck className="w-6 h-6 text-forest-800 shrink-0 mt-0.5" />
            <div>
              <span className="text-[11px] uppercase font-bold text-forest-700 block">Active Rig</span>
              <span className="text-sm font-extrabold text-forest-950 mt-0.5 block">
                {currentUser.rig.lengthFt}ft {currentUser.rig.makeModel || 'RV'}
              </span>
              <span className="text-xs text-cream-900/60 capitalize">
                {currentUser.rig.type.replace('_', ' ')} · Model Year {currentUser.rig.year}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-cream-50 border border-cream-200/80 flex items-start gap-3">
            <Calendar className="w-6 h-6 text-forest-800 shrink-0 mt-0.5" />
            <div>
              <span className="text-[11px] uppercase font-bold text-forest-700 block">RVing Experience</span>
              <span className="text-sm font-extrabold text-forest-950 mt-0.5 block">
                {currentUser.yearsRVing} Years Roaming
              </span>
              <span className="text-xs text-cream-900/60">
                Experienced with 30A/50A power & leveling
              </span>
            </div>
          </div>
        </div>

        {/* Verifications Checklist */}
        <div className="pt-4 border-t border-cream-100 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-forest-800">Trust & Verification Badges</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Email Verified</span>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Phone Verified</span>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>ID Verified</span>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Rig Ownership</span>
            </div>
          </div>
        </div>
      </div>

      {/* Community Reviews Received */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-cream-200 shadow-soft space-y-4">
        <h3 className="text-lg font-extrabold text-forest-950">Community Reviews ({userReviews.length})</h3>
        <div className="space-y-4">
          {userReviews.map(rev => {
            const author = users.find(u => u.id === rev.authorId);
            return (
              <div key={rev.id} className="p-4 rounded-2xl bg-cream-50/70 border border-cream-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-forest-950">{author?.name} ({rev.authorRole})</span>
                  <span className="text-amber-600 font-bold">★ {rev.ratingOverall}</span>
                </div>
                <p className="text-xs text-cream-900/80 italic">"{rev.comment}"</p>
                <div className="text-[10px] text-cream-900/50">{rev.createdAt}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
