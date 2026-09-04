import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { MascotBadge } from './MascotBadge';
import { getCurrentAttribution } from '../../lib/tracker';
import { ShieldCheck, Sparkles, Send, CheckCircle2, Newspaper } from 'lucide-react';

export const Footer: React.FC = () => {
  const { setCurrentView } = useApp();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;

    setLoading(true);
    try {
      const attr = getCurrentAttribution();
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          source: 'footer_form',
          trafficSource: attr.source
        })
      });

      if (res.ok) {
        setSubscribed(true);
        showToast('Subscribed to the CampRoo Weekly Road Digest! 📬', 'success');
        setEmail('');
      } else {
        showToast('Already subscribed or valid email needed.', 'info');
      }
    } catch {
      setSubscribed(true);
      showToast('Subscribed to CampRoo Road Digest! 📬', 'success');
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-dark-50 text-dark-900 border-t border-dark-200 mt-20 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 pb-12 border-b border-dark-200">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-4">
              <MascotBadge size="lg" variant="horizontal" />
              <img
                src="/images/camproo_badge.jpg"
                alt="CampRoo Seal"
                className="w-12 h-12 rounded-full object-cover shadow-xs border border-dark-200 hidden sm:block"
              />
            </div>
            <p className="text-sm text-dark-600 max-w-md leading-relaxed mt-2 font-normal">
              CampRoo is a 100% free peer-to-peer community for RV owners and hosts. Travelers discover unique,
              welcoming spots, connect with trusted hosts, and keep roaming across scenic American highways.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-dark-200 text-xs font-bold text-roo-500 shadow-xs">
                <Sparkles className="w-3.5 h-3.5" /> 100% Free RV Stays
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-dark-200 text-xs font-bold text-emerald-700 shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified RV Community
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3 text-xs font-semibold">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-dark-900">Community</h4>
            <ul className="space-y-2.5 text-dark-600">
              <li>
                <button
                  onClick={() => { setCurrentView('explore'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="hover:text-dark-900 hover:underline"
                >
                  Find a Free Spot
                </button>
              </li>
              <li>
                <button
                  onClick={() => { setCurrentView('host-onboarding'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="hover:text-dark-900 hover:underline"
                >
                  Share Your Spot
                </button>
              </li>
              <li>
                <button
                  onClick={() => { setCurrentView('community'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="hover:text-dark-900 hover:underline"
                >
                  The Roam Hub (Community)
                </button>
              </li>
              <li>
                <button
                  onClick={() => { setCurrentView('safety'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="hover:text-dark-900 hover:underline"
                >
                  Trust & Safety Center
                </button>
              </li>
              <li>
                <button
                  onClick={() => { setCurrentView('admin'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="hover:text-dark-900 hover:underline text-roo-600 font-bold"
                >
                  Ranger Admin Hub
                </button>
              </li>
            </ul>
          </div>

          {/* Newsletter Column */}
          <div className="space-y-3 text-xs">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-dark-900 flex items-center gap-1.5">
              <Newspaper className="w-3.5 h-3.5 text-emerald-600" />
              <span>Weekly Road Digest</span>
            </h4>
            <p className="text-dark-600 leading-relaxed font-normal">
              Get newly verified free RV spots, scenic coordinates, and boondocking tips sent straight to your inbox every Thursday.
            </p>

            {subscribed ? (
              <div className="p-3 bg-emerald-100/80 border border-emerald-300 rounded-2xl text-emerald-900 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>You're on the list! See you Thursday.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2">
                <div className="flex items-center gap-1.5 bg-white border border-dark-300 focus-within:border-emerald-500 rounded-2xl p-1 shadow-xs transition-all">
                  <input
                    type="email"
                    required
                    placeholder="Enter your email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-transparent outline-none text-dark-900 placeholder:text-dark-400 font-medium"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1 shrink-0 transition-colors shadow-xs"
                  >
                    <Send className="w-3 h-3" />
                    <span>Join</span>
                  </button>
                </div>
                <div className="text-[10px] text-dark-500">100% free · Zero spam · Unsubscribe anytime</div>
              </form>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-dark-600">
          <div>
            © 2026 CampRoo, Inc. · Find a spot. Share a spot. Keep roaming. · Privacy · Terms
          </div>
          <div className="flex items-center gap-4 font-bold text-dark-900">
            <span className="text-[11px] text-muted-foreground">Made for American RVers, Campers & Boondockers</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
