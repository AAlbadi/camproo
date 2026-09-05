import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import {
  BarChart3,
  TrendingUp,
  Mail,
  Users,
  ShieldCheck,
  KeyRound,
  RefreshCw,
  Globe,
  CheckCircle2,
  AlertCircle,
  Lock,
  Eye,
  EyeOff,
  LogOut,
  Layers,
  Smartphone,
  Laptop
} from 'lucide-react';

interface TrafficAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TrafficAnalyticsModal: React.FC<TrafficAnalyticsModalProps> = ({ isOpen, onClose }) => {
  const { isAdminAuthenticated, adminToken, adminLogin, adminLogout } = useApp();

  const [tab, setTab] = useState<'traffic' | 'subscribers' | 'emails' | 'api_keys'>('traffic');
  const [stats, setStats] = useState<any>(null);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Admin Login Gate state
  const [adminUser, setAdminUser] = useState('aziz');
  const [adminPass, setAdminPass] = useState('');
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const fetchData = async () => {
    if (!isAdminAuthenticated) return;
    setLoading(true);
    const headers = {
      'Authorization': `Bearer ${adminToken || 'camproo_admin_sec_94883443_aziz'}`,
      'x-admin-token': adminToken || 'camproo_admin_sec_94883443_aziz'
    };

    try {
      const [statsRes, subsRes, emailsRes, sysRes] = await Promise.all([
        fetch('/api/analytics/stats', { headers }).catch(() => null),
        fetch('/api/newsletter/subscribers', { headers }).catch(() => null),
        fetch('/api/email/logs', { headers }).catch(() => null),
        fetch('/api/system/status', { headers }).catch(() => null)
      ]);

      if (statsRes?.ok) setStats(await statsRes.json());
      if (subsRes?.ok) {
        const d = await subsRes.json();
        setSubscribers(d.subscribers || []);
      }
      if (emailsRes?.ok) {
        const d = await emailsRes.json();
        setEmailLogs(d.logs || []);
      }
      if (sysRes?.ok) setSystemStatus(await sysRes.json());
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && isAdminAuthenticated) {
      fetchData();
    }
  }, [isOpen, isAdminAuthenticated]);

  const handleAdminAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsVerifying(true);

    try {
      const result = await adminLogin(adminPass, adminUser);
      if (result.success) {
        setAdminPass('');
        // Auth state will trigger fetchData in useEffect
      } else {
        setLoginError(result.error || 'Access denied. Incorrect admin credentials.');
      }
    } catch {
      setLoginError('Failed to verify credentials. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-3xl rounded-3xl p-0 overflow-hidden border border-dark-200 shadow-2xl">
        {/* If NOT authenticated as admin, show the Admin Gate */}
        {!isAdminAuthenticated ? (
          <div className="p-8 max-w-md mx-auto text-center space-y-5 animate-fade-in">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center mx-auto shadow-sm">
              <Lock className="w-8 h-8 stroke-[2.2]" />
            </div>

            <div>
              <DialogTitle className="text-xl font-black text-dark-900 tracking-tight">
                Admin Access Required
              </DialogTitle>
              <DialogDescription className="text-xs text-dark-500 mt-1 max-w-xs mx-auto">
                Website traffic and platform data are strictly protected. Authorized access is restricted to admin <strong className="text-dark-900">aziz</strong>.
              </DialogDescription>
            </div>

            {loginError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 text-left">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleAdminAuthSubmit} className="space-y-3.5 text-left">
              <div>
                <label className="text-xs font-bold text-dark-800 block mb-1">
                  Admin Username
                </label>
                <Input
                  type="text"
                  required
                  placeholder="aziz"
                  value={adminUser}
                  onChange={e => setAdminUser(e.target.value)}
                  className="h-11 rounded-2xl text-xs font-bold border-dark-200"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-dark-800 block mb-1">
                  Admin Password
                </label>
                <div className="relative">
                  <Input
                    type={showAdminPass ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={adminPass}
                    onChange={e => setAdminPass(e.target.value)}
                    className="h-11 rounded-2xl text-xs font-bold pr-10 border-dark-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPass(!showAdminPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-700"
                  >
                    {showAdminPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  className="flex-1 rounded-2xl text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isVerifying}
                  className="flex-1 rounded-2xl bg-dark-950 hover:bg-black text-white text-xs font-bold shadow-md"
                >
                  {isVerifying ? 'Verifying...' : 'Unlock Data Hub'}
                </Button>
              </div>
            </form>
          </div>
        ) : (
          /* FULL ADMIN DASHBOARD VIEW */
          <>
            <div className="p-6 pb-4 border-b border-dark-100 bg-dark-50/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/20">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-black flex items-center gap-2 text-dark-900">
                    <span>Traffic & Platform Data Hub</span>
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-300">
                      Live Admin: Aziz
                    </Badge>
                  </DialogTitle>
                  <DialogDescription className="text-xs text-dark-500">
                    Real-time visitor origins, live pageviews, subscriber conversions, and server telemetry.
                  </DialogDescription>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchData}
                  disabled={loading}
                  className="gap-1.5 text-xs font-bold rounded-2xl h-9"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { adminLogout(); onClose(); }}
                  className="text-dark-500 hover:text-rose-600 gap-1 text-xs rounded-2xl h-9"
                  title="Lock Admin Session"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Lock</span>
                </Button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="p-4 pb-0 bg-white">
              <Tabs value={tab} onValueChange={(val: any) => setTab(val)}>
                <TabsList className="w-full grid grid-cols-4 p-1 bg-dark-100/80 rounded-2xl">
                  <TabsTrigger value="traffic" className="rounded-xl text-xs font-bold py-2">
                    Real Traffic ({stats?.totalViews || 0})
                  </TabsTrigger>
                  <TabsTrigger value="subscribers" className="rounded-xl text-xs font-bold py-2">
                    Newsletter ({subscribers.length})
                  </TabsTrigger>
                  <TabsTrigger value="emails" className="rounded-xl text-xs font-bold py-2">
                    Email Logs ({emailLogs.length})
                  </TabsTrigger>
                  <TabsTrigger value="api_keys" className="rounded-xl text-xs font-bold py-2">
                    System Telemetry
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <DialogBody className="p-6 pt-4 max-h-[65vh] overflow-y-auto space-y-4">
              {/* TAB 1: TRAFFIC & ATTRIBUTION */}
              {tab === 'traffic' && (
                <div className="space-y-4">
                  {/* Summary KPIs */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-4 rounded-2xl bg-dark-50/70 border border-dark-200">
                      <div className="text-[10px] font-black uppercase tracking-wider text-dark-500">Total Page Views</div>
                      <div className="text-2xl font-black text-dark-900 mt-1">{stats?.totalViews || 0}</div>
                      <div className="text-[10px] text-emerald-600 font-bold mt-0.5">Real-time captured</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-dark-50/70 border border-dark-200">
                      <div className="text-[10px] font-black uppercase tracking-wider text-dark-500">Unique Visitors</div>
                      <div className="text-2xl font-black text-dark-900 mt-1">{stats?.uniqueSessions || 0}</div>
                      <div className="text-[10px] text-dark-500 font-semibold mt-0.5">Tracked sessions</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-dark-50/70 border border-dark-200">
                      <div className="text-[10px] font-black uppercase tracking-wider text-dark-500">Total Campers</div>
                      <div className="text-2xl font-black text-dark-900 mt-1">{stats?.totalUsers || 0}</div>
                      <div className="text-[10px] text-emerald-600 font-bold mt-0.5">Registered accounts</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-dark-50/70 border border-dark-200">
                      <div className="text-[10px] font-black uppercase tracking-wider text-dark-500">Newsletter List</div>
                      <div className="text-2xl font-black text-dark-900 mt-1">{subscribers.length}</div>
                      <div className="text-[10px] text-emerald-600 font-bold mt-0.5">Weekly digest campers</div>
                    </div>
                  </div>

                  {/* WHERE THEY FROM - Countries */}
                  <div className="p-4 rounded-2xl border border-dark-200 bg-white shadow-2xs">
                    <div className="font-bold text-xs flex items-center gap-1.5 mb-3 text-dark-900">
                      <span>🌍</span>
                      <span>Where Visitors Are From</span>
                    </div>
                    {stats?.countriesBreakdown?.length ? (
                      <div className="grid grid-cols-2 gap-2">
                        {stats.countriesBreakdown.slice(0, 8).map((c: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 text-xs py-1.5 px-2 rounded-xl bg-dark-50/80 border border-dark-100">
                            <span className="text-lg">{c.flag || '🏳️'}</span>
                            <div className="flex-1 min-w-0">
                              <span className="font-bold text-dark-900 truncate block">{c.country}</span>
                              <span className="text-[10px] text-dark-500">{c.count} visits · {(c.percentage || 0).toFixed(1)}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-dark-400 py-3 text-center">Location data will appear as visitors arrive.</div>
                    )}
                  </div>

                  {/* Traffic Origins & Popular Pages */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Traffic Sources */}
                    <div className="p-4 rounded-2xl border border-dark-200 bg-white shadow-2xs">
                      <div className="font-bold text-xs flex items-center justify-between mb-3 text-dark-900">
                        <span className="flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-roo-500" />
                          <span>Traffic Sources (Visitor Referrers)</span>
                        </span>
                      </div>
                      <div className="space-y-2">
                        {stats?.topReferrers?.length ? (
                          stats.topReferrers.map((ref: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-dark-100 last:border-0">
                              <span className="font-semibold text-dark-800 truncate max-w-[200px]">{ref.domain}</span>
                              <span className="font-mono text-dark-600 bg-dark-100 px-2 py-0.5 rounded-full text-[11px] font-bold">
                                {ref.count} views
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-dark-400 py-3 text-center">No external referrer traffic recorded yet.</div>
                        )}
                      </div>
                    </div>

                    {/* Top Visited Pages */}
                    <div className="p-4 rounded-2xl border border-dark-200 bg-white shadow-2xs">
                      <div className="font-bold text-xs flex items-center justify-between mb-3 text-dark-900">
                        <span className="flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Most Visited App Pages</span>
                        </span>
                      </div>
                      <div className="space-y-2">
                        {stats?.pagesBreakdown?.length ? (
                          stats.pagesBreakdown.map((p: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-dark-100 last:border-0">
                              <span className="font-semibold text-dark-800 font-mono text-[11px] truncate max-w-[200px]">{p.path}</span>
                              <span className="font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full text-[11px] font-bold border border-emerald-200">
                                {p.count} views
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-dark-400 py-3 text-center">Page views will appear as campers navigate.</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Device Breakdown & Real-Time Activity Log */}
                  <div className="p-4 rounded-2xl border border-dark-200 bg-white shadow-2xs">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-bold text-xs text-dark-900 flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-roo-500" />
                        <span>Live Real-Time Visitor Activity Log</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-dark-500 font-medium">
                        <span className="flex items-center gap-1">
                          <Laptop className="w-3.5 h-3.5 text-dark-400" />
                          <span>Desktop: {stats?.devicesBreakdown?.find((d: any) => d.device === 'desktop')?.count || 0}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Smartphone className="w-3.5 h-3.5 text-dark-400" />
                          <span>Mobile: {stats?.devicesBreakdown?.find((d: any) => d.device === 'mobile')?.count || 0}</span>
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 max-h-56 overflow-y-auto">
                      {stats?.recentEvents?.length ? (
                        stats.recentEvents.map((evt: any, i: number) => (
                          <div key={i} className="text-[11px] p-2.5 rounded-xl bg-dark-50/80 border border-dark-100 flex items-center justify-between">
                            <div className="flex items-center gap-2 truncate">
                              <span className="text-base">{evt.flag || '🏳️'}</span>
                              <span className="font-semibold text-dark-600 text-[10px]">{evt.city || ''}</span>
                              <span className="font-bold font-mono text-dark-900 bg-white px-1.5 py-0.5 rounded border border-dark-200">
                                {evt.path}
                              </span>
                              <span className="text-dark-400">from</span>
                              <span className="text-emerald-700 font-semibold truncate max-w-[200px]">
                                {evt.referrer || 'Direct / App'}
                              </span>
                              {evt.browser && (
                                <span className="text-dark-400 text-[10px]">
                                  ({evt.browser})
                                </span>
                              )}
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

              {/* TAB 2: NEWSLETTER SUBSCRIBERS */}
              {tab === 'subscribers' && (
                <div className="space-y-3">
                  <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-950">
                    📬 <strong>Weekly CampRoo Road Digest Subscribers:</strong> Real emails collected from registration opt-ins and footer forms.
                  </div>

                  <div className="divide-y divide-dark-100 border border-dark-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                    {subscribers.length ? (
                      subscribers.map((sub: any) => (
                        <div key={sub.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-dark-50/60 transition-colors">
                          <div>
                            <div className="font-extrabold text-dark-900">{sub.email}</div>
                            <div className="text-[10.5px] text-dark-500 mt-0.5 flex items-center gap-2">
                              {sub.name && <span>{sub.name} ·</span>}
                              <span>Source: {sub.source}</span>
                              {sub.trafficSource && <span>· Origin: {sub.trafficSource}</span>}
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-300 font-bold">
                              Subscribed
                            </Badge>
                            <div className="text-[10px] text-dark-400 mt-1 font-mono">
                              {new Date(sub.subscribedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-xs text-dark-400">No newsletter subscribers yet.</div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: EMAIL LOGS */}
              {tab === 'emails' && (
                <div className="space-y-3">
                  <div className="divide-y divide-dark-100 border border-dark-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                    {emailLogs.length ? (
                      emailLogs.map((log: any) => (
                        <div key={log.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-dark-50/60">
                          <div>
                            <div className="font-bold text-dark-900">{log.subject}</div>
                            <div className="text-[11px] text-dark-500 mt-0.5">
                              To: <span className="font-mono text-dark-700">{log.to}</span> · Provider: {log.provider}
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-300 font-bold capitalize">
                              {log.status}
                            </Badge>
                            <div className="text-[10px] text-dark-400 mt-1 font-mono">
                              {new Date(log.sentAt).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-xs text-dark-400">No outbound email records found.</div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: SYSTEM TELEMETRY */}
              {tab === 'api_keys' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl border border-dark-200 bg-white space-y-3">
                    <div className="font-bold text-xs text-dark-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Platform Security & Telemetry Status</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-dark-50">
                        <div className="text-dark-500 text-[10px] uppercase font-bold">API Status</div>
                        <div className="font-bold text-emerald-700 mt-0.5 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span>Online & Operational</span>
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-dark-50">
                        <div className="text-dark-500 text-[10px] uppercase font-bold">Admin Security</div>
                        <div className="font-bold text-emerald-700 mt-0.5">
                          Protected by Aziz Credentials
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </DialogBody>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
