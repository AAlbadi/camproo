import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import {
  ShieldAlert,
  Users,
  Home,
  Star,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Sparkles,
  Search,
  Eye,
  Trash2,
  Lock,
  Unlock,
  BadgeCheck,
  MessageSquare
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const {
    users,
    spots,
    requests,
    reports,
    reviews,
    adminToggleSuspendUser,
    adminToggleFeatureSpot,
    adminResolveReport,
    adminToggleVerifyUser,
    deleteSpot,
    setCurrentView,
    setSelectedSpotId,
  } = useApp();

  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'analytics' | 'reports' | 'users' | 'spots' | 'reviews' | 'verifications'>('analytics');
  const [userSearch, setUserSearch] = useState('');
  const [spotSearch, setSpotSearch] = useState('');

  // Analytics Metrics
  const totalUsers = users.length;
  const totalSpots = spots.length;
  const totalRequests = requests.length;
  const pendingReports = reports.filter(r => r.status === 'pending');
  const totalFreeNightsHosted = requests
    .filter(r => r.status === 'accepted' || r.status === 'completed')
    .reduce((acc, r) => acc + r.nights, 0);

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredSpots = spots.filter(s =>
    s.title.toLowerCase().includes(spotSearch.toLowerCase()) ||
    s.locationName.toLowerCase().includes(spotSearch.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in bg-white">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-dark-200">
        <div className="flex items-center gap-4">
          <img
            src="/images/camproo_badge.jpg"
            alt="CampRoo Ranger Seal"
            className="w-16 h-16 rounded-full object-cover shadow-sm border-2 border-roo-300 hidden sm:block shrink-0"
          />
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-roo-50 text-roo-700 text-xs font-bold uppercase tracking-wider mb-2 border border-roo-200">
              <ShieldAlert className="w-3.5 h-3.5 text-roo-500" />
              PLATFORM OPERATIONS & SAFETY
            </div>
            <h1 className="text-3xl font-extrabold text-dark-900 tracking-tight">
              CampRoo Ranger Admin Hub
            </h1>
            <p className="text-xs sm:text-sm text-dark-600 mt-0.5">
              Monitor community safety, resolve user reports, audit free spots, and manage platform health.
            </p>
          </div>
        </div>

        {/* Tab Navigator */}
        <div className="flex flex-wrap items-center bg-dark-100 p-1 rounded-2xl border border-dark-200 self-start">
          {(['analytics', 'reports', 'users', 'spots', 'reviews', 'verifications'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                activeTab === tab
                  ? 'bg-dark-900 text-white shadow-xs'
                  : 'text-dark-600 hover:text-dark-900'
              }`}
            >
              {tab === 'reports' && pendingReports.length > 0 ? (
                <span className="flex items-center gap-1.5">
                  <span>Reports</span>
                  <span className="w-2 h-2 rounded-full bg-roo-500 animate-pulse" />
                </span>
              ) : (
                tab
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ANALYTICS TAB */}
      {activeTab === 'analytics' && (
        <div className="space-y-8 animate-fade-in">
          {/* Key KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-3xl border border-dark-200 shadow-airbnb">
              <span className="text-[11px] font-bold text-dark-500 uppercase block">Registered RVers</span>
              <span className="text-3xl font-black text-dark-900 mt-1 block">{totalUsers}</span>
              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" /> +24% growth
              </span>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-dark-200 shadow-airbnb">
              <span className="text-[11px] font-bold text-dark-500 uppercase block">Free Spots Listed</span>
              <span className="text-3xl font-black text-dark-900 mt-1 block">{totalSpots}</span>
              <span className="text-[10px] text-roo-500 font-bold mt-1 block">100% Free peer pads</span>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-dark-200 shadow-airbnb">
              <span className="text-[11px] font-bold text-dark-500 uppercase block">Free Nights Hosted</span>
              <span className="text-3xl font-black text-dark-900 mt-1 block">{totalFreeNightsHosted}</span>
              <span className="text-[10px] text-emerald-600 font-bold mt-1 block">$0 booking fees</span>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-dark-200 shadow-airbnb">
              <span className="text-[11px] font-bold text-dark-500 uppercase block">Pending Reports</span>
              <span className={`text-3xl font-black mt-1 block ${pendingReports.length > 0 ? 'text-roo-500' : 'text-dark-900'}`}>
                {pendingReports.length}
              </span>
              <span className="text-[10px] text-dark-500 font-semibold mt-1 block">Ranger triage queue</span>
            </div>
          </div>

          {/* Platform Health Matrix */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-dark-200 shadow-airbnb space-y-4">
            <h3 className="text-lg font-extrabold text-dark-900">Community Integrity & Quality Standards</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-dark-50 border border-dark-200 space-y-1">
                <span className="font-bold text-dark-900 block">Identity Verification Rate</span>
                <p className="text-2xl font-black text-emerald-600">96.4%</p>
                <span className="text-dark-600">Phone, email, and ID verified</span>
              </div>

              <div className="p-4 rounded-2xl bg-dark-50 border border-dark-200 space-y-1">
                <span className="font-bold text-dark-900 block">Average Host Rating</span>
                <p className="text-2xl font-black text-dark-900">4.95 ★</p>
                <span className="text-dark-600">Across {reviews.length} completed stays</span>
              </div>

              <div className="p-4 rounded-2xl bg-dark-50 border border-dark-200 space-y-1">
                <span className="font-bold text-dark-900 block">Repeat Welcome Rate</span>
                <p className="text-2xl font-black text-roo-500">99.1%</p>
                <span className="text-dark-600">"Would welcome again" responses</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REPORTS TAB */}
      {activeTab === 'reports' && (
        <div className="space-y-4 animate-fade-in">
          <h2 className="text-xl font-extrabold text-dark-900">Safety Reports Queue</h2>
          {reports.length === 0 ? (
            <div className="bg-white p-8 rounded-3xl text-center border border-dark-200 text-xs text-dark-500">
              No reports filed. All community activity is harmonious!
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map(rep => (
                <div
                  key={rep.id}
                  className="bg-white p-6 rounded-3xl border border-dark-200 shadow-airbnb space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          rep.status === 'pending'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {rep.status}
                      </span>
                      <span className="text-xs font-bold text-dark-900">
                        {rep.reportedTargetType.toUpperCase()}: {rep.targetName}
                      </span>
                    </div>
                    <span className="text-xs text-dark-500">{rep.createdAt.split('T')[0]}</span>
                  </div>

                  <div className="text-xs text-dark-700">
                    <strong>Reason:</strong> {rep.reason}
                    <p className="mt-1 text-dark-600 italic">"{rep.details}"</p>
                  </div>

                  {rep.adminNotes && (
                    <div className="text-xs bg-dark-50 p-2.5 rounded-xl border border-dark-200">
                      <strong>Ranger Resolution Note:</strong> {rep.adminNotes}
                    </div>
                  )}

                  {rep.status === 'pending' && (
                    <div className="flex justify-end gap-2 pt-2 border-t border-dark-100">
                      <button
                        onClick={() => {
                          adminResolveReport(rep.id, 'Audited: No safety violation found.');
                          showToast('Report dismissed after review.', 'info');
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-dark-100 hover:bg-dark-200 text-dark-900 text-xs font-bold"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => {
                          adminResolveReport(rep.id, 'Action taken: Contacted owner and verified details.');
                          showToast('Report marked as resolved!', 'success');
                        }}
                        className="px-4 py-1.5 rounded-xl bg-dark-900 hover:bg-black text-white text-xs font-bold shadow-xs"
                      >
                        Resolve & Close
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* USERS TAB */}
      {activeTab === 'users' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-extrabold text-dark-900">Platform Users ({filteredUsers.length})</h2>
            <div className="relative w-64">
              <Search className="w-4 h-4 text-dark-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search user name or email..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-dark-300 text-xs text-dark-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-dark-200 shadow-airbnb overflow-hidden divide-y divide-dark-100">
            {filteredUsers.map(u => (
              <div key={u.id} className="p-4 sm:p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded-2xl object-cover" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-dark-900">{u.name}</span>
                      <span className="text-[10px] px-2 py-0.2 rounded bg-dark-100 font-semibold capitalize">
                        {u.role}
                      </span>
                      {u.isSuspended && (
                        <span className="text-[10px] px-2 py-0.2 rounded bg-red-100 text-red-700 font-extrabold">
                          SUSPENDED
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-dark-600">
                      {u.email} · {u.homeRegion} · {u.rig.lengthFt}ft {u.rig.type}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      adminToggleSuspendUser(u.id);
                      showToast(
                        u.isSuspended ? `User ${u.name} reinstated.` : `User ${u.name} suspended.`,
                        u.isSuspended ? 'success' : 'error'
                      );
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                      u.isSuspended
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {u.isSuspended ? (
                      <>
                        <Unlock className="w-3 h-3" />
                        <span>Reactivate</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3" />
                        <span>Suspend</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SPOTS TAB */}
      {activeTab === 'spots' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-extrabold text-dark-900">Listed Free Spots ({filteredSpots.length})</h2>
            <div className="relative w-64">
              <Search className="w-4 h-4 text-dark-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search spots..."
                value={spotSearch}
                onChange={e => setSpotSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-dark-300 text-xs text-dark-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-dark-200 shadow-airbnb overflow-hidden divide-y divide-dark-100">
            {filteredSpots.map(s => (
              <div key={s.id} className="p-4 sm:p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img src={s.photos[0]} alt={s.title} className="w-12 h-12 rounded-2xl object-cover" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-dark-900">{s.title}</span>
                      {s.isFeatured && (
                        <span className="text-[10px] px-2 py-0.2 rounded-full bg-roo-100 text-roo-800 font-extrabold">
                          FEATURED
                        </span>
                      )}
                      <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                        FREE
                      </span>
                    </div>
                    <div className="text-[11px] text-dark-600">
                      {s.locationName}, {s.generalArea} · Up to {s.rigCompatibility.maxLengthFt}ft
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      adminToggleFeatureSpot(s.id);
                      showToast(s.isFeatured ? 'Spot removed from featured.' : 'Spot marked as featured!', 'success');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                      s.isFeatured ? 'bg-dark-100 text-dark-800' : 'bg-roo-50 text-roo-600'
                    }`}
                  >
                    {s.isFeatured ? 'Unfeature' : 'Feature'}
                  </button>

                  <button
                    onClick={() => {
                      setSelectedSpotId(s.id);
                      setCurrentView('spot-detail');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-dark-900 text-white text-xs font-bold"
                  >
                    Inspect
                  </button>

                  <button
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to remove "${s.title}"?`)) {
                        deleteSpot(s.id);
                        showToast(`Spot "${s.title}" removed.`, 'info');
                      }
                    }}
                    className="p-1.5 rounded-xl text-dark-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Remove Spot"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* REVIEWS TAB */}
      {activeTab === 'reviews' && (
        <div className="space-y-4 animate-fade-in">
          <h2 className="text-xl font-extrabold text-dark-900">Community Reviews Moderation ({reviews.length})</h2>
          <div className="space-y-3">
            {reviews.map(rev => {
              const author = users.find(u => u.id === rev.authorId);
              const spot = spots.find(s => s.id === rev.spotId);
              return (
                <div key={rev.id} className="p-5 rounded-3xl bg-white border border-dark-200 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-dark-900">{author?.name} for "{spot?.title || 'Spot'}"</span>
                    <span className="text-amber-500 font-bold">★ {rev.ratingOverall}</span>
                  </div>
                  <p className="text-xs text-dark-700 italic">"{rev.comment}"</p>
                  <div className="flex items-center justify-between pt-2 border-t border-dark-100 text-[11px] text-dark-500">
                    <span>Cleanliness: {rev.categories.cleanliness} · Hospitality: {rev.categories.hospitality}</span>
                    <span className="text-emerald-700 font-bold">
                      {rev.wouldWelcomeAgain ? '✓ Welcomes Again' : 'No'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VERIFICATIONS TAB */}
      {activeTab === 'verifications' && (
        <div className="space-y-4 animate-fade-in">
          <h2 className="text-xl font-extrabold text-dark-900">Member Verification Management</h2>
          <p className="text-xs text-dark-600">
            Audit and grant trust verification badges to members based on phone, ID documents, and vehicle registration.
          </p>
          <div className="bg-white rounded-3xl border border-dark-200 shadow-sm divide-y divide-dark-100 overflow-hidden">
            {users.map(u => (
              <div key={u.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img src={u.avatar} alt="" className="w-10 h-10 rounded-2xl object-cover" />
                  <div>
                    <span className="font-bold text-xs text-dark-900 block">{u.name} ({u.homeRegion})</span>
                    <span className="text-[11px] text-dark-500">{u.rig.lengthFt}ft {u.rig.type}</span>
                  </div>
                </div>

                {/* Badges Toggles */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <button
                    onClick={() => {
                      adminToggleVerifyUser(u.id, 'idDocument');
                      showToast(`Updated ID verification for ${u.name}.`, 'info');
                    }}
                    className={`px-3 py-1 rounded-xl font-bold transition-all ${
                      u.verifications.idDocument ? 'bg-emerald-100 text-emerald-800' : 'bg-dark-100 text-dark-500'
                    }`}
                  >
                    ID Document: {u.verifications.idDocument ? 'Verified' : 'Pending'}
                  </button>

                  <button
                    onClick={() => {
                      adminToggleVerifyUser(u.id, 'rvOwnership');
                      showToast(`Updated Rig verification for ${u.name}.`, 'info');
                    }}
                    className={`px-3 py-1 rounded-xl font-bold transition-all ${
                      u.verifications.rvOwnership ? 'bg-emerald-100 text-emerald-800' : 'bg-dark-100 text-dark-500'
                    }`}
                  >
                    Rig Ownership: {u.verifications.rvOwnership ? 'Verified' : 'Pending'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
