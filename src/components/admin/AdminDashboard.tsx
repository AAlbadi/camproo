import React, { useState, useEffect } from 'react';
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
  MessageSquare,
  Mail
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
    isAdminAuthenticated,
    adminLogin,
    adminLogout
  } = useApp();

  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'analytics' | 'vsotd' | 'reports' | 'users' | 'spots' | 'reviews' | 'verifications'>('analytics');
  const [userSearch, setUserSearch] = useState('');
  const [spotSearch, setSpotSearch] = useState('');

  // Admin gate form states
  const [adminUser, setAdminUser] = useState('aziz');
  const [adminPass, setAdminPass] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [gateError, setGateError] = useState('');

  const [liveStats, setLiveStats] = useState<any>(null);
  const [vsotd, setVsotd] = useState<any>(null);
  const [selectedVsotdSpotId, setSelectedVsotdSpotId] = useState<string>('');
  const [vsotdNote, setVsotdNote] = useState<string>('');
  const [isSavingVsotd, setIsSavingVsotd] = useState(false);
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);

  const fetchLiveStats = async () => {
    if (!isAdminAuthenticated) return;
    setLoadingStats(true);
    try {
      const headers = {
        'Authorization': `Bearer camproo_admin_sec_94883443_aziz`,
        'x-admin-token': 'camproo_admin_sec_94883443_aziz'
      };
      const [statsRes, emailsRes, vsotdRes] = await Promise.all([
        fetch('/api/analytics/stats', { headers }).catch(() => null),
        fetch('/api/email/logs', { headers }).catch(() => null),
        fetch('/api/vsotd').catch(() => null)
      ]);
      if (statsRes?.ok) setLiveStats(await statsRes.json());
      if (emailsRes?.ok) {
        const d = await emailsRes.json();
        setEmailLogs(d.logs || []);
      }
      if (vsotdRes?.ok) {
        const v = await vsotdRes.json();
        if (v.vsotd) {
          setVsotd(v.vsotd);
          if (!selectedVsotdSpotId) setSelectedVsotdSpotId(v.vsotd.spotId || '');
          if (!vsotdNote) setVsotdNote(v.vsotd.highlightNote || '');
        }
      }
    } catch (err) {
      console.error('Error fetching admin stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (isAdminAuthenticated) fetchLiveStats();
  }, [isAdminAuthenticated]);

  const handleAdminGateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGateError('');
    setIsVerifying(true);
    try {
      const res = await adminLogin(adminPass, adminUser);
      if (res.success) {
        showToast('Admin access verified. Welcome Aziz.', 'success');
        setAdminPass('');
      } else {
        setGateError(res.error || 'Access denied. Incorrect admin credentials.');
      }
    } catch {
      setGateError('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRegisterVsotd = async (spotIdToRegister?: string, noteToRegister?: string) => {
    const targetSpotId = spotIdToRegister || selectedVsotdSpotId;
    if (!targetSpotId) {
      showToast('Please select a spot to designate as VSOTD.', 'error');
      return;
    }
    setIsSavingVsotd(true);
    try {
      const spot = spots.find(s => s.id === targetSpotId);
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer camproo_admin_sec_94883443_aziz`,
        'x-admin-token': 'camproo_admin_sec_94883443_aziz'
      };
      const res = await fetch('/api/vsotd/register', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          spotId: targetSpotId,
          title: spot?.title || 'Featured Haven',
          locationName: spot?.locationName || 'United States',
          highlightNote: noteToRegister || vsotdNote || 'Featured Ranger Choice VSOTD.'
        })
      });
      if (res.ok) {
        const data = await res.json();
        setVsotd(data.vsotd);
        showToast(`VSOTD registered: "${spot?.title || targetSpotId}"`, 'success');
        fetchLiveStats();
      }
    } catch (err) {
      showToast('Failed to register VSOTD.', 'error');
    } finally {
      setIsSavingVsotd(false);
    }
  };

  // If not authenticated, render Admin Gate
  if (!isAdminAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 animate-fade-in text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center mx-auto shadow-sm">
          <Lock className="w-8 h-8 stroke-[2.2]" />
        </div>

        <div>
          <h2 className="text-2xl font-black text-dark-900 tracking-tight">
            Ranger Admin Portal Restricted
          </h2>
          <p className="text-xs text-dark-500 mt-1 max-w-sm mx-auto">
            Platform moderation, spot auditing, and account safety controls are strictly restricted to admin <strong className="text-dark-900">aziz</strong>.
          </p>
        </div>

        {gateError && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 text-left">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{gateError}</span>
          </div>
        )}

        <form onSubmit={handleAdminGateSubmit} className="space-y-3.5 text-left border border-dark-200 p-6 rounded-3xl bg-white shadow-xl">
          <div>
            <label className="text-xs font-bold text-dark-800 block mb-1">
              Admin Username
            </label>
            <input
              type="text"
              required
              value={adminUser}
              onChange={e => setAdminUser(e.target.value)}
              placeholder="aziz"
              className="w-full h-11 px-3.5 rounded-2xl text-xs font-bold border border-dark-200 focus:border-roo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-dark-800 block mb-1">
              Admin Password
            </label>
            <input
              type="password"
              required
              value={adminPass}
              onChange={e => setAdminPass(e.target.value)}
              placeholder="••••••••••••"
              className="w-full h-11 px-3.5 rounded-2xl text-xs font-bold border border-dark-200 focus:border-roo-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isVerifying}
            className="w-full h-11 rounded-2xl bg-dark-950 hover:bg-black text-white font-bold text-xs shadow-md transition-all mt-2"
          >
            {isVerifying ? 'Verifying Credentials...' : 'Unlock Ranger Admin Portal'}
          </button>
        </form>
      </div>
    );
  }

  // Analytics Metrics
  const totalUsers = users.length;
  const totalSpots = spots.length;
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
              Monitor community safety, resolve user reports, audit free spots, register VSOTD, and manage platform telemetry.
            </p>
          </div>
        </div>

        {/* Tab Navigator */}
        <div className="flex flex-wrap items-center bg-dark-100 p-1 rounded-2xl border border-dark-200 self-start">
          {(['analytics', 'vsotd', 'reports', 'users', 'spots', 'reviews', 'verifications'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                activeTab === tab
                  ? 'bg-dark-900 text-white shadow-xs'
                  : 'text-dark-600 hover:text-dark-900'
              }`}
            >
              {tab === 'vsotd' ? (
                'VSOTD & Data'
              ) : tab === 'reports' && pendingReports.length > 0 ? (
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
        <div className="space-y-6 animate-fade-in">
          {/* Refresh */}
          <div className="flex justify-end">
            <button
              onClick={fetchLiveStats}
              disabled={loadingStats}
              className="px-4 py-2 rounded-2xl bg-dark-900 hover:bg-black text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all"
            >
              {loadingStats ? 'Loading...' : '🔄 Refresh Live Telemetry'}
            </button>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-dark-200 shadow-airbnb">
              <span className="text-[11px] font-bold text-dark-500 uppercase block">Registered RVers</span>
              <span className="text-3xl font-black text-dark-900 mt-1 block">{totalUsers}</span>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-dark-200 shadow-airbnb">
              <span className="text-[11px] font-bold text-dark-500 uppercase block">Free Spots Listed</span>
              <span className="text-3xl font-black text-dark-900 mt-1 block">{totalSpots}</span>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-dark-200 shadow-airbnb">
              <span className="text-[11px] font-bold text-dark-500 uppercase block">Free Nights Hosted</span>
              <span className="text-3xl font-black text-dark-900 mt-1 block">{totalFreeNightsHosted}</span>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-amber-200 shadow-airbnb">
              <span className="text-[11px] font-bold text-amber-600 uppercase block">Active VSOTD</span>
              <span className="text-sm font-black text-dark-900 mt-1 block truncate max-w-[140px]">{vsotd?.title || 'Moab Oasis'}</span>
              <span className="text-[10px] text-amber-700 font-bold block mt-0.5">{vsotd?.clicks || 0} clicks recorded</span>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-emerald-200 shadow-airbnb">
              <span className="text-[11px] font-bold text-emerald-600 uppercase block">Total Link Opens</span>
              <span className="text-3xl font-black text-emerald-700 mt-1 block">{liveStats?.totalViews || 0}</span>
              <span className="text-[10px] text-dark-500 font-semibold block mt-0.5">{liveStats?.uniqueSessions || 0} unique visitors</span>
            </div>
          </div>

          {/* WHERE THEY FROM - Countries */}
          <div className="bg-white p-6 rounded-3xl border border-dark-200 shadow-airbnb space-y-4">
            <h3 className="text-lg font-extrabold text-dark-900 flex items-center gap-2">🌍 Where They're From (Countries)</h3>
            {liveStats?.countriesBreakdown?.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {liveStats.countriesBreakdown.map((c: any, i: number) => (
                  <div key={i} className="p-3.5 rounded-2xl bg-dark-50 border border-dark-200 flex items-center gap-3">
                    <span className="text-2xl">{c.flag || '🏳️'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-dark-900 truncate">{c.country || 'Unknown'}</span>
                        <span className="text-xs font-black text-dark-900 ml-2">{c.count}</span>
                      </div>
                      <div className="w-full bg-dark-200 rounded-full h-1.5 mt-1">
                        <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${c.percentage || 0}%` }} />
                      </div>
                      <span className="text-[10px] text-dark-500 mt-0.5 block">{(c.percentage || 0).toFixed(1)}% of visitors</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-dark-400 py-4 text-center">Visitor location telemetry active. Data updates as traffic arrives.</div>
            )}
          </div>

          {/* WHERE THEY FROM - Cities */}
          <div className="bg-white p-6 rounded-3xl border border-dark-200 shadow-airbnb space-y-4">
            <h3 className="text-lg font-extrabold text-dark-900 flex items-center gap-2">🏙️ Top Cities</h3>
            {liveStats?.citiesBreakdown?.length ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {liveStats.citiesBreakdown.slice(0, 12).map((c: any, i: number) => (
                  <div key={i} className="p-3 rounded-2xl bg-dark-50 border border-dark-100 text-center">
                    <div className="text-sm font-bold text-dark-900">{c.city || 'Unknown'}</div>
                    <div className="text-[10px] text-dark-500">{c.country}</div>
                    <div className="text-lg font-black text-emerald-600 mt-1">{c.count}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-dark-400 py-4 text-center">City data telemetry active.</div>
            )}
          </div>

          {/* HOW MANY OPENED THE LINK - Pages & Sources */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-dark-200 shadow-airbnb space-y-3">
              <h3 className="text-sm font-extrabold text-dark-900">🔗 Link Opens (Pages Visited)</h3>
              {liveStats?.pagesBreakdown?.length ? (
                liveStats.pagesBreakdown.slice(0, 10).map((p: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-dark-100 last:border-0">
                    <span className="font-mono font-bold text-dark-800 truncate max-w-[180px]">{p.path}</span>
                    <span className="font-mono bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full text-[11px] font-bold border border-emerald-200">{p.count} opens</span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-dark-400 py-3 text-center">No page views recorded yet.</div>
              )}
            </div>

            <div className="bg-white p-6 rounded-3xl border border-dark-200 shadow-airbnb space-y-3">
              <h3 className="text-sm font-extrabold text-dark-900">📡 Traffic Sources</h3>
              {liveStats?.topReferrers?.length ? (
                liveStats.topReferrers.slice(0, 10).map((r: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-dark-100 last:border-0">
                    <span className="font-semibold text-dark-800 truncate max-w-[200px]">{r.domain}</span>
                    <span className="font-mono text-dark-600 bg-dark-100 px-2 py-0.5 rounded-full text-[11px] font-bold">{r.count} views</span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-dark-400 py-3 text-center">No referrer data yet.</div>
              )}
            </div>
          </div>

          {/* Live Visitor Stream */}
          <div className="bg-white p-6 rounded-3xl border border-dark-200 shadow-airbnb space-y-3">
            <h3 className="text-sm font-extrabold text-dark-900">⚡ Live Visitor Activity Telemetry</h3>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {liveStats?.recentEvents?.length ? (
                liveStats.recentEvents.map((evt: any, i: number) => (
                  <div key={i} className="text-[11px] p-2.5 rounded-xl bg-dark-50/80 border border-dark-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-base">{evt.flag || '🌍'}</span>
                      <span className="font-semibold text-dark-600">{evt.city || evt.country || 'Unknown'}</span>
                      <span className="font-bold font-mono text-dark-900 bg-white px-1.5 py-0.5 rounded border border-dark-200">{evt.path}</span>
                      <span className="text-dark-400">from</span>
                      <span className="text-emerald-700 font-semibold truncate max-w-[150px]">{evt.referrer || 'Direct'}</span>
                    </div>
                    <span className="text-dark-500 text-[10px] whitespace-nowrap pl-2 font-mono">
                      {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-dark-400 py-4 text-center">No visitor events recorded yet.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VSOTD & DATA TAB */}
      {activeTab === 'vsotd' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-gradient-to-r from-amber-500/10 via-roo-500/10 to-emerald-500/10 p-6 rounded-3xl border border-amber-500/20 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-xl shadow-md">
                ⭐
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-dark-900">Vehicle & Spot Of The Day (VSOTD) Registry</h2>
                <p className="text-xs text-dark-600">
                  Select and register the official daily Vehicle & Spot pick. Clicks and impressions are recorded in real-time.
                </p>
              </div>
            </div>

            {/* Current Active VSOTD Card */}
            {vsotd && (
              <div className="p-5 rounded-2xl bg-white border border-dark-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black uppercase tracking-wider">
                    CURRENT ACTIVE VSOTD PICK
                  </span>
                  <span className="text-xs text-dark-500 font-mono">
                    Updated: {new Date(vsotd.selectedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-3xl">🦘</div>
                  <div>
                    <h3 className="text-base font-extrabold text-dark-900">{vsotd.title}</h3>
                    <p className="text-xs text-dark-500">{vsotd.locationName}</p>
                    <p className="text-xs text-amber-800 italic font-semibold mt-1">"{vsotd.highlightNote}"</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 pt-3 border-t border-dark-100 text-xs">
                  <span className="font-bold text-dark-700">👆 Total Clicks: <span className="text-emerald-600 font-black">{vsotd.clicks || 0}</span></span>
                  <span className="font-bold text-dark-700">👁️ Telemetry Impressions: <span className="text-roo-600 font-black">{vsotd.impressions || 1250}</span></span>
                </div>
              </div>
            )}

            {/* VSOTD Form */}
            <form onSubmit={e => { e.preventDefault(); handleRegisterVsotd(); }} className="p-5 rounded-2xl bg-white border border-dark-200 shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold text-dark-900">Register New VSOTD Spot</h3>

              <div>
                <label className="text-xs font-bold text-dark-800 block mb-1">Select Spot from Network</label>
                <select
                  value={selectedVsotdSpotId}
                  onChange={e => setSelectedVsotdSpotId(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-2xl text-xs font-bold border border-dark-200 focus:border-roo-500 focus:outline-none bg-white"
                >
                  <option value="">-- Choose Spot --</option>
                  {spots.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.title} ({s.locationName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-dark-800 block mb-1">Highlight Note / Ranger Choice</label>
                <input
                  type="text"
                  value={vsotdNote}
                  onChange={e => setVsotdNote(e.target.value)}
                  placeholder="e.g. Level 30A pull-through pad minutes from Arches National Park."
                  className="w-full h-11 px-3.5 rounded-2xl text-xs font-bold border border-dark-200 focus:border-roo-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingVsotd}
                className="px-6 py-2.5 rounded-2xl bg-dark-900 hover:bg-black text-white text-xs font-bold shadow-md transition-all"
              >
                {isSavingVsotd ? 'Registering VSOTD...' : 'Register & Publish VSOTD'}
              </button>
            </form>
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
                      {s.id === vsotd?.spotId && (
                        <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-100 text-amber-900 font-black border border-amber-300">
                          ⭐ VSOTD
                        </span>
                      )}
                      {s.visibility === 'personal' ? (
                        <span className="text-[10px] px-2 py-0.2 rounded-full bg-indigo-100 text-indigo-800 font-extrabold">
                          PERSONAL
                        </span>
                      ) : s.reviewStatus === 'pending_review' ? (
                        <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-100 text-amber-800 font-extrabold">
                          PENDING REVIEW
                        </span>
                      ) : null}
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
                      {s.contactEmail && (
                        <span className="ml-2 text-dark-500">· Submitter: <span className="font-semibold text-dark-800">{s.submitterName || 'Host'}</span> ({s.contactEmail})</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRegisterVsotd(s.id, `Ranger Choice: ${s.title}`)}
                    className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 transition-colors"
                  >
                    Set VSOTD
                  </button>

                  {s.contactEmail && (
                    <a
                      href={`mailto:${s.contactEmail}?subject=${encodeURIComponent(`Regarding your CampRoo spot: ${s.title}`)}&body=${encodeURIComponent(`Hi ${s.submitterName || 'there'},\n\nThank you for sharing ${s.title} on CampRoo. I reviewed your submission and wanted to connect.\n\nBest regards,\nCampRoo Team`)}`}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1 border border-emerald-200 transition-colors"
                      title={`Email ${s.submitterName || 'Submitter'} at ${s.contactEmail}`}
                    >
                      <Mail className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Email Host</span>
                    </a>
                  )}
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
                    <span>Cleanliness: {rev.categories?.cleanliness || 5} · Hospitality: {rev.categories?.hospitality || 5}</span>
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
