import React, { useState, useEffect } from 'react';
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
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import {
  BarChart3,
  TrendingUp,
  Mail,
  Users,
  ShieldCheck,
  KeyRound,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Globe,
  Radio,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface TrafficAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TrafficAnalyticsModal: React.FC<TrafficAnalyticsModalProps> = ({ isOpen, onClose }) => {
  const [tab, setTab] = useState<'traffic' | 'subscribers' | 'emails' | 'api_keys'>('traffic');
  const [stats, setStats] = useState<any>(null);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, subsRes, emailsRes, sysRes] = await Promise.all([
        fetch('/api/analytics/stats').catch(() => null),
        fetch('/api/newsletter/subscribers').catch(() => null),
        fetch('/api/email/logs').catch(() => null),
        fetch('/api/system/status').catch(() => null)
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
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black flex items-center gap-2">
                  <span>CampRoo Traffic, Data & Email Hub</span>
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Live
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  Real-time visitor origin, newsletter subscribers, signups attribution, and API status.
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={loading}
              className="gap-1.5 text-xs font-bold"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          </div>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="p-3 pb-0">
          <Tabs value={tab} onValueChange={(val: any) => setTab(val)}>
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="traffic">Traffic & Origins</TabsTrigger>
              <TabsTrigger value="subscribers">Newsletter ({subscribers.length})</TabsTrigger>
              <TabsTrigger value="emails">Sent Emails ({emailLogs.length})</TabsTrigger>
              <TabsTrigger value="api_keys">1-Key API Setup</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <DialogBody className="max-h-[68vh] overflow-y-auto pr-2">
          {/* TAB 1: TRAFFIC & ATTRIBUTION */}
          {tab === 'traffic' && (
            <div className="space-y-4">
              {/* Summary KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-muted/40 border border-border">
                  <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Total Page Views</div>
                  <div className="text-2xl font-black text-foreground mt-1">{stats?.totalViews || 0}</div>
                  <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Real-time captured</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-muted/40 border border-border">
                  <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Unique Visitors</div>
                  <div className="text-2xl font-black text-foreground mt-1">{stats?.uniqueSessions || 0}</div>
                  <div className="text-[10px] text-muted-foreground font-semibold mt-0.5">Tracked sessions</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-muted/40 border border-border">
                  <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Total Campers</div>
                  <div className="text-2xl font-black text-foreground mt-1">{stats?.totalUsers || 0}</div>
                  <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Registered accounts</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-muted/40 border border-border">
                  <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Newsletter Opt-ins</div>
                  <div className="text-2xl font-black text-foreground mt-1">{subscribers.length}</div>
                  <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Weekly Digest list</div>
                </div>
              </div>

              {/* Where traffic is from */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-border bg-card">
                  <div className="font-bold text-xs flex items-center justify-between mb-3 text-foreground">
                    <span className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-primary" />
                      <span>Traffic Sources (Where Visitors Come From)</span>
                    </span>
                  </div>
                  <div className="space-y-2">
                    {stats?.topReferrers?.length ? (
                      stats.topReferrers.map((ref: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-border/50 last:border-0">
                          <span className="font-semibold text-foreground truncate max-w-[200px]">{ref.domain}</span>
                          <span className="font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full text-[11px]">
                            {ref.count} views
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-muted-foreground py-2 text-center">No external referrer traffic yet.</div>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-border bg-card">
                  <div className="font-bold text-xs flex items-center justify-between mb-3 text-foreground">
                    <span className="flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Signups by Marketing Origin</span>
                    </span>
                  </div>
                  <div className="space-y-2">
                    {stats?.signupsBySource && Object.keys(stats.signupsBySource).length > 0 ? (
                      Object.entries(stats.signupsBySource).map(([src, count]: any, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-border/50 last:border-0">
                          <span className="font-semibold capitalize text-foreground">{src}</span>
                          <span className="font-mono text-emerald-700 bg-emerald-50 font-bold px-2 py-0.5 rounded-full text-[11px]">
                            {count} signed up
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-muted-foreground py-2 text-center">Signups will show attribution here.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Traffic Feed */}
              <div className="p-4 rounded-2xl border border-border bg-card">
                <div className="font-bold text-xs mb-2 text-foreground">Live Visitor Activity Log</div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {stats?.recentEvents?.map((evt: any, i: number) => (
                    <div key={i} className="text-[11px] p-2 rounded-xl bg-muted/40 flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-bold text-foreground">{evt.path}</span>
                        <span className="text-muted-foreground">from</span>
                        <span className="text-emerald-700 font-medium truncate max-w-[220px]">{evt.referrer || 'Direct'}</span>
                      </div>
                      <span className="text-muted-foreground text-[10px] whitespace-nowrap">
                        {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: NEWSLETTER SUBSCRIBERS */}
          {tab === 'subscribers' && (
            <div className="space-y-3">
              <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-xs text-emerald-900 leading-relaxed">
                📬 Campers who checked <strong>"Opt-in to the Weekly CampRoo Road Digest"</strong> during Google, Facebook, Apple or custom registration, plus footer subscribers.
              </div>

              <div className="divide-y divide-border border border-border rounded-2xl overflow-hidden bg-card">
                {subscribers.map((sub: any) => (
                  <div key={sub.id} className="p-3 flex items-center justify-between text-xs hover:bg-muted/30">
                    <div>
                      <div className="font-bold text-foreground">{sub.email}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-2">
                        {sub.name && <span>{sub.name} ·</span>}
                        <span>Source: {sub.source}</span>
                        <span>· Traffic: {sub.trafficSource}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-300 font-bold">
                        Subscribed
                      </Badge>
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {new Date(sub.subscribedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: EMAIL PIPELINE LOGS */}
          {tab === 'emails' && (
            <div className="space-y-3">
              <div className="p-3 bg-muted/40 rounded-2xl border border-border text-xs leading-relaxed text-foreground">
                ✉️ Complete audit log of all transactional welcome emails and newsletter confirmation dispatches.
              </div>

              <div className="space-y-2">
                {emailLogs.map((log: any) => (
                  <div key={log.id} className="p-3 rounded-2xl border border-border bg-card text-xs flex items-center justify-between">
                    <div>
                      <div className="font-bold text-foreground">{log.subject}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        To: <span className="font-mono text-foreground">{log.to}</span> · Provider: {log.provider}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {log.status}
                      </span>
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {new Date(log.sentAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: 1-KEY API SETUP */}
          {tab === 'api_keys' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-primary/10 border border-emerald-500/20 space-y-2">
                <div className="font-black text-sm text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>The Easiest Way: 1 Single Free Key for Google, Facebook & Apple</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Instead of creating 3 separate developer accounts at Google, Facebook, and Apple, you can use <strong>Clerk</strong> or <strong>Supabase</strong>. Their free tier gives you all 3 famous logins with <strong>ONE single API key</strong>!
                </p>
              </div>

              {/* Steps for Clerk */}
              <div className="p-4 rounded-2xl border border-border bg-card space-y-3">
                <div className="font-bold text-foreground text-xs flex items-center justify-between">
                  <span className="font-black">Option 1: Clerk (Easiest - 1 Key for Everything)</span>
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 text-[10px] font-bold">100% Free</Badge>
                </div>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>Go to <a href="https://clerk.com" target="_blank" rel="noreferrer" className="text-primary font-bold underline">Clerk.com</a> and sign up for a free account.</li>
                  <li>Click <strong>Create application</strong>, and flip the toggle switches ON for <strong>Google</strong>, <strong>Facebook</strong>, and <strong>Apple</strong>.</li>
                  <li>Copy your <strong>Publishable Key</strong> (looks like <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-[11px]">pk_test_...</code>).</li>
                  <li>Paste it in your <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-[11px]">.env</code> file as:
                    <pre className="mt-1 p-2 rounded-xl bg-dark-900 text-white font-mono text-[11px]">CLERK_PUBLISHABLE_KEY=pk_test_your_key_here</pre>
                  </li>
                </ol>
              </div>

              {/* Email service key */}
              <div className="p-4 rounded-2xl border border-border bg-card space-y-3">
                <div className="font-bold text-foreground text-xs flex items-center justify-between">
                  <span className="font-black">Email Service (For Welcome & Newsletter Emails)</span>
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 text-[10px] font-bold">3,000 Free/mo</Badge>
                </div>
                <p className="text-muted-foreground">
                  Use <strong>Resend</strong> (takes 30 seconds):
                </p>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>Sign up at <a href="https://resend.com" target="_blank" rel="noreferrer" className="text-primary font-bold underline">Resend.com</a>.</li>
                  <li>Create an API Key at <strong>API Keys &rarr; Create API Key</strong>.</li>
                  <li>Paste in <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-[11px]">.env</code>:
                    <pre className="mt-1 p-2 rounded-xl bg-dark-900 text-white font-mono text-[11px]">RESEND_API_KEY=re_your_api_key_here</pre>
                  </li>
                </ol>
              </div>
            </div>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
};
