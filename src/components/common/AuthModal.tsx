import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { RVType, RV_TYPE_LABELS } from '../../types';
import { getCurrentAttribution } from '../../lib/tracker';
import { isSupabaseConfigured, signInWithSocial } from '../../lib/supabase';
import {
  Sparkles,
  Truck,
  ShieldCheck,
  Mail,
  Fingerprint,
  KeyRound,
  CheckCircle2,
  ArrowRight,
  UserCheck,
  Check,
  Newspaper
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'signup' }) => {
  const { registerUser, switchUser, users } = useApp();
  const { showToast } = useToast();

  const [mode, setMode] = useState<'quick_social' | 'signup'>('quick_social');
  const [role, setRole] = useState<'traveler' | 'host'>('traveler');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [homeRegion, setHomeRegion] = useState('Sedona, AZ');
  const [rvType, setRvType] = useState<RVType>('class_c');
  const [makeModel, setMakeModel] = useState('Coachmen Leprechaun');
  const [lengthFt, setLengthFt] = useState(28);
  const [bio, setBio] = useState('Passionate US roamer exploring scenic backroads and meeting community hosts.');
  const [newsletterOptIn, setNewsletterOptIn] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  // Unified Multi-Service Social Login Handler (Google, Apple)
  const handleSocialAuth = async (provider: 'google' | 'apple') => {
    setIsLoading(true);
    const attribution = getCurrentAttribution();

    // If Supabase keys are provided in .env, authenticate via Supabase OAuth
    if (isSupabaseConfigured) {
      const { error } = await signInWithSocial(provider);
      if (error) {
        showToast(`Supabase Error: ${error.message}`, 'error');
        setIsLoading(false);
      }
      return;
    }

    try {
      const res = await fetch(`/api/auth/social/${provider}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          newsletterOptIn,
          trafficAttribution: attribution
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          // Sync with React state
          registerUser(data.user);
          switchUser(data.user.id);
          const providerName = provider === 'google' ? 'Google' : 'Apple ID';
          showToast(`Signed in via ${providerName}! Welcome ${data.user.name.split(' ')[0]}`, 'success');
          confetti({ particleCount: 60, spread: 55, origin: { y: 0.6 } });
          onClose();
          return;
        }
      }
    } catch (err) {
      console.warn('[AuthModal] Social API error, using local fallback:', err);
    } finally {
      setIsLoading(false);
    }

    // Fallback if server is in offline mock mode
    if (provider === 'google') {
      const existing = users.find(u => u.email.includes('alex'));
      if (existing) switchUser(existing.id);
      showToast('Signed in via Google! Profile loaded.', 'success');
    } else {
      const existing = users.find(u => u.role === 'traveler');
      if (existing) switchUser(existing.id);
      showToast('Signed in via Apple ID! Profile loaded.', 'success');
    }
    confetti({ particleCount: 50, spread: 50, origin: { y: 0.6 } });
    onClose();
  };

  // Manual Signup Form Handler
  const handleManualSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    setIsLoading(true);
    const attribution = getCurrentAttribution();

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          role,
          phone: phone || '+1 (555) 789-0123',
          homeRegion: homeRegion || 'United States',
          rvType,
          makeModel,
          lengthFt,
          bio,
          newsletterOptIn,
          trafficAttribution: attribution
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          registerUser(data.user);
          switchUser(data.user.id);
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
          showToast(
            newsletterOptIn
              ? `Welcome to CampRoo, ${name}! Profile & newsletter active.`
              : `Welcome to CampRoo, ${name}! Profile created.`,
            'success'
          );
          onClose();
          return;
        }
      }
    } catch (err) {
      console.warn('[AuthModal] Registration API error, using client fallback:', err);
    } finally {
      setIsLoading(false);
    }

    // Client fallback
    registerUser({
      name,
      role,
      email,
      phone: phone || '+1 (555) 789-0123',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      bio,
      homeRegion: homeRegion || 'United States',
      yearsRVing: 3,
      rig: {
        type: rvType,
        makeModel,
        lengthFt,
        year: 2023,
      },
      verifications: {
        email: true,
        phone: true,
        idDocument: true,
        rvOwnership: true,
      },
    });

    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    showToast(`Welcome to CampRoo, ${name}! Your profile is active.`, 'success');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-lg">
        {/* Header with Mascot Badge */}
        <DialogHeader>
          <div className="flex items-center gap-3">
            <img
              src="/images/camproo_app_icon.jpg"
              alt="CampRoo Mascot"
              className="w-11 h-11 rounded-2xl object-cover shadow-sm border border-roo-200 shrink-0"
            />
            <div>
              <DialogTitle className="flex items-center gap-1.5">
                <span className="font-black text-dark-900">Camp<span className="text-roo-500">Roo</span></span>
                <span className="text-muted-foreground font-normal">·</span>
                <span className="text-sm">
                  {mode === 'quick_social' ? 'Instant Sign In' : mode === 'signup' ? 'Create Rig Profile' : 'Select Account'}
                </span>
              </DialogTitle>
              <DialogDescription>
                Find a spot. Share a spot. Keep roaming. · 100% Free USA
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Tab Navigation (shadcn Tabs) */}
        <div className="p-3 pb-0">
          <Tabs value={mode} onValueChange={(val: any) => setMode(val)}>
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="quick_social">Sign In (Google / Apple)</TabsTrigger>
              <TabsTrigger value="signup">Create Account</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Body */}
        <DialogBody>
          {mode === 'quick_social' && (
            <div className="space-y-4">
              <div className="text-center space-y-1 mb-2">
                <p className="text-xs text-muted-foreground">
                  Connect securely with your Google account or Apple ID:
                </p>
              </div>

              {/* Newsletter Opt-in Checkbox for 1-Click Social Sign-in */}
              <div
                onClick={() => setNewsletterOptIn(!newsletterOptIn)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                  newsletterOptIn
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-dark-900'
                    : 'bg-muted/40 border-border text-muted-foreground'
                }`}
              >
                <div
                  className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-all ${
                    newsletterOptIn
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'border-muted-foreground/50 bg-background'
                  }`}
                >
                  {newsletterOptIn && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <div className="text-xs leading-tight">
                  <div className="font-bold flex items-center gap-1.5 text-foreground">
                    <Newspaper className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Opt-in to the Weekly CampRoo Road Digest</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    Receive verified new free RV coordinates and boondocking guides. Unsubscribe anytime.
                  </div>
                </div>
              </div>

              {/* Clean Providers: Google & Apple only */}
              <div className="space-y-3 pt-1">
                {/* Google Sign In */}
                <Button
                  variant="outline"
                  size="default"
                  disabled={isLoading}
                  onClick={() => handleSocialAuth('google')}
                  className="w-full h-12 justify-center gap-3 text-xs font-bold hover:bg-muted/60 border-border shadow-xs"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </Button>

                {/* Apple Sign In */}
                <Button
                  variant="default"
                  size="default"
                  disabled={isLoading}
                  onClick={() => handleSocialAuth('apple')}
                  className="w-full h-12 justify-center gap-3 text-xs font-bold bg-dark-950 hover:bg-black text-white shadow-xs"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 170 170">
                    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.6-7.77-11.74-14.2-6.53-10.2-11.45-21.73-14.75-34.58-3.3-12.85-4.96-24.81-4.96-35.88 0-16.19 4.13-29.6 12.39-40.23 8.27-10.63 18.66-16.03 31.18-16.2 4.35 0 9.42 1.25 15.22 3.75 5.79 2.5 9.77 3.86 11.93 4.08 1.96-.22 6.04-1.63 12.24-4.22 6.2-2.6 11.41-3.8 15.63-3.6 11.53.54 20.85 4.7 27.97 12.49-10.01 6.1-15.02 14.68-15.02 25.75 0 8.7 3.38 16.2 10.13 22.49 6.76 6.3 14.81 9.9 24.16 10.8-2.18 6.53-4.79 13.06-7.84 19.59zM119.22 33.07c0-7.39 2.67-14.35 8.01-20.87 5.34-6.53 11.87-10.55 19.6-12.08.43 1.96.65 3.8.65 5.54 0 7.3-2.73 14.3-8.19 21-5.46 6.7-12.06 10.66-19.8 11.87-.1-.98-.27-2.79-.27-5.46z" />
                  </svg>
                  <span>Continue with Apple</span>
                </Button>
              </div>
            </div>
          )}


          {mode === 'signup' && (
            <form onSubmit={handleManualSignUp} className="space-y-4 text-xs">
              {/* Role selection */}
              <div>
                <label className="font-black text-muted-foreground block mb-1.5 uppercase text-[10px] tracking-wider">
                  Select Your Focus:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('traveler')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      role === 'traveler'
                        ? 'border-primary bg-primary/10 font-bold text-foreground ring-1 ring-primary'
                        : 'border-border bg-card text-muted-foreground'
                    }`}
                  >
                    <span className="block font-black text-xs text-foreground">Find Free Spots</span>
                    <span className="block text-[10px] text-muted-foreground mt-0.5">I roam in an RV</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('host')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      role === 'host'
                        ? 'border-primary bg-primary/10 font-bold text-foreground ring-1 ring-primary'
                        : 'border-border bg-card text-muted-foreground'
                    }`}
                  >
                    <span className="block font-black text-xs text-foreground">Share A Spot</span>
                    <span className="block text-[10px] text-muted-foreground mt-0.5">I have space for rigs</span>
                  </button>
                </div>
              </div>

              {/* Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-foreground block mb-1">Full Name</label>
                  <Input
                    type="text"
                    required
                    placeholder="e.g. Jordan Miller"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="font-bold text-foreground block mb-1">Email Address</label>
                  <Input
                    type="email"
                    required
                    placeholder="jordan@camproo.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Home Region & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-foreground block mb-1">US Home Base / State</label>
                  <Input
                    type="text"
                    placeholder="e.g. Flagstaff, AZ"
                    value={homeRegion}
                    onChange={e => setHomeRegion(e.target.value)}
                  />
                </div>
                <div>
                  <label className="font-bold text-foreground block mb-1">Mobile Phone</label>
                  <Input
                    type="text"
                    placeholder="+1 (555) 234-5678"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                  />
                </div>
              </div>

              {/* Rig Details */}
              <div className="p-3.5 rounded-2xl bg-muted/50 border border-border space-y-3">
                <div className="font-bold text-foreground flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-primary" />
                  <span>Your RV Vehicle Setup</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground block mb-0.5">RV Type</label>
                    <select
                      value={rvType}
                      onChange={e => setRvType(e.target.value as RVType)}
                      className="w-full h-11 p-2 rounded-2xl border border-input bg-background text-xs font-bold text-foreground"
                    >
                      {Object.entries(RV_TYPE_LABELS).map(([k, l]) => (
                        <option key={k} value={k}>{l}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground block mb-0.5">Make & Model</label>
                    <Input
                      type="text"
                      value={makeModel}
                      onChange={e => setMakeModel(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground block mb-0.5">Length (ft)</label>
                    <Input
                      type="number"
                      min={10}
                      max={45}
                      value={lengthFt}
                      onChange={e => setLengthFt(Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              {/* Newsletter Opt-in Checkbox */}
              <div
                onClick={() => setNewsletterOptIn(!newsletterOptIn)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                  newsletterOptIn
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-dark-900'
                    : 'bg-muted/40 border-border text-muted-foreground'
                }`}
              >
                <div
                  className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-all ${
                    newsletterOptIn
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'border-muted-foreground/50 bg-background'
                  }`}
                >
                  {newsletterOptIn && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <div className="text-xs leading-tight">
                  <div className="font-bold flex items-center gap-1.5 text-foreground">
                    <Newspaper className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Receive the Weekly CampRoo Road Digest</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    Send me new host locations, free boondocking spot coordinates, and RV road updates. You can unsubscribe anytime.
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="default"
                  disabled={isLoading}
                  className="gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isLoading ? 'Creating...' : 'Create Free Account'}</span>
                </Button>
              </div>
            </form>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
};
