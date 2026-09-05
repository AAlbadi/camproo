import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { RVType, RV_TYPE_LABELS } from '../../types';
import { getCurrentAttribution } from '../../lib/tracker';
import { isSupabaseConfigured, signInWithSocial } from '../../lib/supabase';
import {
  Sparkles,
  Truck,
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Newspaper,
  Loader2,
  ShieldAlert,
  ArrowRight,
  Compass,
  Home
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
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signin'
}) => {
  const { registerUser, switchUser, users, adminLogin, setIsAuthenticated, openSupportModal } = useApp();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>(initialMode);
  
  // Sign In Form States
  const [signInIdentifier, setSignInIdentifier] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Sign Up Form States
  const [role, setRole] = useState<'traveler' | 'host'>('traveler');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [homeRegion, setHomeRegion] = useState('Sedona, AZ');
  const [showVehicleDetails, setShowVehicleDetails] = useState(false);
  const [rvType, setRvType] = useState<RVType>('class_c');
  const [makeModel, setMakeModel] = useState('Coachmen Leprechaun');
  const [lengthFt, setLengthFt] = useState(28);
  const [newsletterOptIn, setNewsletterOptIn] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Sync tab when initialMode prop changes
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialMode);
      setErrorMessage('');
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  // Handle Standard Sign In (Includes Admin Aziz: aziz / 94883443@Aa)
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const cleanId = signInIdentifier.trim();
    const cleanPass = signInPassword;

    if (!cleanId || !cleanPass) {
      setErrorMessage('Please enter your username/email and password.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Check if Admin Aziz credentials
      const isAdminAttempt = cleanId.toLowerCase() === 'aziz' || 
                             cleanId.toLowerCase() === 'aziz@camproo.com' ||
                             cleanId.toLowerCase() === 'realalbadi@gmail.com';

      if (isAdminAttempt && cleanPass === '94883443@Aa') {
        const res = await adminLogin(cleanPass, 'aziz');
        if (res.success) {
          setIsAuthenticated(true);
          localStorage.setItem('camproo_is_authenticated', 'true');
          showToast('Welcome back, Admin Aziz! Full access granted.', 'success');
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
          onClose();
          return;
        }
      }

      // 2. Call backend login API
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: cleanId, password: cleanPass })
      });

      const data = await res.json();

      if (res.ok && data.success && data.user) {
        if (data.isAdmin) {
          await adminLogin(cleanPass, 'aziz');
        } else {
          registerUser(data.user);
          switchUser(data.user.id);
          setIsAuthenticated(true);
          localStorage.setItem('camproo_is_authenticated', 'true');
        }
        showToast(`Welcome back, ${data.user.name.split(' ')[0]}!`, 'success');
        confetti({ particleCount: 50, spread: 50, origin: { y: 0.6 } });
        onClose();
        return;
      }

      // 3. Fallback check against local users list
      const matchedUser = users.find(
        u => (u.email && u.email.toLowerCase() === cleanId.toLowerCase()) ||
             (u.name && u.name.toLowerCase() === cleanId.toLowerCase())
      );

      if (matchedUser) {
        switchUser(matchedUser.id);
        setIsAuthenticated(true);
        localStorage.setItem('camproo_is_authenticated', 'true');
        showToast(`Welcome back, ${matchedUser.name.split(' ')[0]}!`, 'success');
        confetti({ particleCount: 50, spread: 50, origin: { y: 0.6 } });
        onClose();
        return;
      }

      setErrorMessage('Invalid credentials. Please check your username and password.');
    } catch (err) {
      console.warn('[AuthModal] Login error:', err);
      // Fallback for offline admin
      if (cleanId.toLowerCase() === 'aziz' && cleanPass === '94883443@Aa') {
        await adminLogin(cleanPass, 'aziz');
        showToast('Welcome back, Admin Aziz!', 'success');
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        onClose();
        return;
      }
      setErrorMessage('Unable to connect to server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle 1-Click Social Sign-In (Google / Apple)
  const handleSocialAuth = async (provider: 'google' | 'apple') => {
    setIsLoading(true);
    setErrorMessage('');
    const attribution = getCurrentAttribution();

    if (isSupabaseConfigured) {
      const { error } = await signInWithSocial(provider);
      if (error) {
        showToast(`Supabase: ${error.message}`, 'error');
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
          registerUser(data.user);
          switchUser(data.user.id);
          setIsAuthenticated(true);
          localStorage.setItem('camproo_is_authenticated', 'true');
          const providerName = provider === 'google' ? 'Google' : 'Apple';
          showToast(`Signed in with ${providerName}! Welcome ${data.user.name.split(' ')[0]}`, 'success');
          confetti({ particleCount: 50, spread: 55, origin: { y: 0.6 } });
          onClose();
          return;
        }
      }
    } catch (err) {
      console.warn('[AuthModal] Social API error, fallback to demo profile:', err);
    } finally {
      setIsLoading(false);
    }

    // Local client fallback - fresh user start
    const providerCapitalized = provider === 'google' ? 'Google' : 'Apple';
    const fallbackUser = registerUser({
      name: `${providerCapitalized} Roamer`,
      role: 'traveler',
      email: `${provider}_user_${Date.now().toString().slice(-4)}@camproo.com`,
      phone: '+1 (555) 019-2834',
      avatar: `https://ui-avatars.com/api/?name=${providerCapitalized}+Roamer&background=0284c7&color=fff&bold=true`,
      bio: 'Verified roamer exploring scenic spots and public lands across America.',
      homeRegion: 'United States',
      yearsRVing: 1,
      rig: {
        type: 'class_c',
        makeModel: 'Camper Van / Rig',
        lengthFt: 25,
        year: 2024,
      },
      verifications: { email: true, phone: false, idDocument: false, rvOwnership: true }
    });
    switchUser(fallbackUser.id);
    setIsAuthenticated(true);
    localStorage.setItem('camproo_is_authenticated', 'true');
    showToast(`Signed in with ${providerCapitalized}! Welcome ${fallbackUser.name}`, 'success');
    confetti({ particleCount: 40, spread: 45, origin: { y: 0.6 } });
    onClose();
  };

  // Handle Sign Up
  const handleManualSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!name || !email) {
      setErrorMessage('Please provide your name and email address.');
      return;
    }

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
          homeRegion,
          rvType,
          makeModel,
          lengthFt,
          newsletterOptIn,
          trafficAttribution: attribution
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          registerUser(data.user);
          switchUser(data.user.id);
          setIsAuthenticated(true);
          localStorage.setItem('camproo_is_authenticated', 'true');
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
          showToast(`Welcome to CampRoo, ${name}! Your profile is active.`, 'success');
          onClose();
          return;
        }
      }
    } catch (err) {
      console.warn('[AuthModal] Registration API error, fallback:', err);
    } finally {
      setIsLoading(false);
    }

    // Client fallback registration
    const newUser = registerUser({
      name,
      role,
      email,
      phone: '+1 (555) 789-0123',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'RVer')}&background=0284c7&color=fff&bold=true`,
      bio: 'Verified US roamer roaming scenic spots.',
      homeRegion: homeRegion || 'United States',
      yearsRVing: 3,
      rig: {
        type: rvType,
        makeModel,
        lengthFt,
        year: 2024,
      },
      verifications: {
        email: true,
        phone: true,
        idDocument: true,
        rvOwnership: true,
      },
    });

    switchUser(newUser.id);
    setIsAuthenticated(true);
    localStorage.setItem('camproo_is_authenticated', 'true');
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    showToast(`Welcome to CampRoo, ${name}! Profile created.`, 'success');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border border-dark-200 bg-white shadow-2xl">
        {/* Clean Header */}
        <div className="pt-6 px-6 pb-4 bg-gradient-to-b from-dark-50/70 to-transparent">
          <div className="flex items-center gap-3">
            <img
              src="/images/camproo_app_icon.jpg"
              alt="CampRoo"
              className="w-10 h-10 rounded-2xl object-cover shadow-sm border border-roo-200 shrink-0"
            />
            <div>
              <DialogTitle className="text-xl font-black text-dark-900 tracking-tight flex items-center gap-1.5">
                <span>Camp</span><span className="text-roo-500">Roo</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-roo-50 text-roo-700 border border-roo-200">
                  100% Free USA
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-dark-500 mt-0.5">
                {activeTab === 'signin'
                  ? 'Sign in to access saved spots, trips, and messaging.'
                  : 'Join the free boondocking & private spot community.'}
              </DialogDescription>
            </div>
          </div>

          {/* Clean Segmented Tabs */}
          <div className="mt-5">
            <Tabs value={activeTab} onValueChange={(val: any) => { setActiveTab(val); setErrorMessage(''); }}>
              <TabsList className="w-full grid grid-cols-2 p-1 bg-dark-100/80 rounded-2xl">
                <TabsTrigger
                  value="signin"
                  className="rounded-xl text-xs font-bold py-2 data-[state=active]:bg-white data-[state=active]:text-dark-950 data-[state=active]:shadow-xs transition-all"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="rounded-xl text-xs font-bold py-2 data-[state=active]:bg-white data-[state=active]:text-dark-950 data-[state=active]:shadow-xs transition-all"
                >
                  Create Account
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Modal Body */}
        <DialogBody className="px-6 pb-6 pt-2 space-y-4">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: SIGN IN */}
          {activeTab === 'signin' && (
            <div className="space-y-4">
              {/* Quick 1-Click Social Sign-In */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleSocialAuth('google')}
                  className="h-11 px-3 rounded-2xl border border-dark-200 hover:border-dark-300 hover:bg-dark-50 flex items-center justify-center gap-2 text-xs font-bold text-dark-800 transition-all shadow-2xs"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleSocialAuth('apple')}
                  className="h-11 px-3 rounded-2xl bg-dark-950 hover:bg-black text-white flex items-center justify-center gap-2 text-xs font-bold transition-all shadow-2xs"
                >
                  <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 170 170">
                    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.6-7.77-11.74-14.2-6.53-10.2-11.45-21.73-14.75-34.58-3.3-12.85-4.96-24.81-4.96-35.88 0-16.19 4.13-29.6 12.39-40.23 8.27-10.63 18.66-16.03 31.18-16.2 4.35 0 9.42 1.25 15.22 3.75 5.79 2.5 9.77 3.86 11.93 4.08 1.96-.22 6.04-1.63 12.24-4.22 6.2-2.6 11.41-3.8 15.63-3.6 11.53.54 20.85 4.7 27.97 12.49-10.01 6.1-15.02 14.68-15.02 25.75 0 8.7 3.38 16.2 10.13 22.49 6.76 6.3 14.81 9.9 24.16 10.8-2.18 6.53-4.79 13.06-7.84 19.59zM119.22 33.07c0-7.39 2.67-14.35 8.01-20.87 5.34-6.53 11.87-10.55 19.6-12.08.43 1.96.65 3.8.65 5.54 0 7.3-2.73 14.3-8.19 21-5.46 6.7-12.06 10.66-19.8 11.87-.1-.98-.27-2.79-.27-5.46z" />
                  </svg>
                  <span>Apple</span>
                </button>
              </div>

              {/* Divider */}
              <div className="relative flex items-center justify-center py-1">
                <div className="border-t border-dark-200 w-full" />
                <span className="bg-white px-3 text-[11px] text-dark-400 uppercase tracking-wider font-semibold">
                  or continue with credentials
                </span>
              </div>

              {/* Sign In Form */}
              <form onSubmit={handleSignIn} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-dark-800 block mb-1">
                    Email or Username
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-dark-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <Input
                      type="text"
                      required
                      placeholder="aziz or name@camproo.com"
                      value={signInIdentifier}
                      onChange={e => setSignInIdentifier(e.target.value)}
                      className="pl-10 h-11 rounded-2xl text-xs font-medium border-dark-200 focus:border-roo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-dark-800 block mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-dark-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <Input
                      type={showSignInPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={signInPassword}
                      onChange={e => setSignInPassword(e.target.value)}
                      className="pl-10 pr-10 h-11 rounded-2xl text-xs font-medium border-dark-200 focus:border-roo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignInPassword(!showSignInPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-700"
                    >
                      {showSignInPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-dark-600">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-roo-500 border-dark-300 focus:ring-roo-400"
                    />
                    <span>Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      openSupportModal('Account & Login Assistance', 'Password Reset Request');
                    }}
                    className="text-dark-500 hover:text-dark-900 font-medium"
                  >
                    Forgot password?
                  </button>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 rounded-2xl bg-roo-500 hover:bg-roo-600 text-white font-bold text-xs shadow-md transition-all mt-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <ArrowRight className="w-4 h-4 mr-2" />
                  )}
                  <span>{isLoading ? 'Verifying...' : 'Sign In'}</span>
                </Button>
              </form>

              {/* Bottom Switcher */}
              <div className="text-center pt-2">
                <p className="text-xs text-dark-500">
                  Don't have an account yet?{' '}
                  <button
                    type="button"
                    onClick={() => { setActiveTab('signup'); setErrorMessage(''); }}
                    className="text-roo-600 font-bold hover:underline"
                  >
                    Create free account
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: CREATE ACCOUNT */}
          {activeTab === 'signup' && (
            <form onSubmit={handleManualSignUp} className="space-y-3.5 text-xs">
              {/* Role Selection */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-dark-500 block mb-1.5">
                  Select Your Main Focus:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('traveler')}
                    className={`p-2.5 rounded-2xl border text-left transition-all flex items-center gap-2.5 ${
                      role === 'traveler'
                        ? 'border-roo-500 bg-roo-50/50 text-dark-900 ring-1 ring-roo-500 font-bold'
                        : 'border-dark-200 bg-white text-dark-600 hover:bg-dark-50'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-xl bg-roo-500/10 text-roo-600 flex items-center justify-center shrink-0">
                      <Compass className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-extrabold text-xs text-dark-900">Find Free Spots</div>
                      <div className="text-[10px] text-dark-500">I roam in an RV</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('host')}
                    className={`p-2.5 rounded-2xl border text-left transition-all flex items-center gap-2.5 ${
                      role === 'host'
                        ? 'border-roo-500 bg-roo-50/50 text-dark-900 ring-1 ring-roo-500 font-bold'
                        : 'border-dark-200 bg-white text-dark-600 hover:bg-dark-50'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-xl bg-roo-500/10 text-roo-600 flex items-center justify-center shrink-0">
                      <Home className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-extrabold text-xs text-dark-900">Share A Spot</div>
                      <div className="text-[10px] text-dark-500">I have space for rigs</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs font-bold text-dark-800 block mb-1">Full Name</label>
                  <Input
                    type="text"
                    required
                    placeholder="e.g. Jordan Miller"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="h-10 rounded-2xl text-xs font-medium border-dark-200 focus:border-roo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-dark-800 block mb-1">Email Address</label>
                  <Input
                    type="email"
                    required
                    placeholder="jordan@camproo.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="h-10 rounded-2xl text-xs font-medium border-dark-200 focus:border-roo-500"
                  />
                </div>
              </div>

              {/* Home State / Region */}
              <div>
                <label className="text-xs font-bold text-dark-800 block mb-1">US Home State / Region</label>
                <Input
                  type="text"
                  placeholder="e.g. Flagstaff, AZ"
                  value={homeRegion}
                  onChange={e => setHomeRegion(e.target.value)}
                  className="h-10 rounded-2xl text-xs font-medium border-dark-200 focus:border-roo-500"
                />
              </div>

              {/* Optional Vehicle Setup Accordion */}
              <div className="border border-dark-200 rounded-2xl p-3 bg-dark-50/50">
                <div
                  onClick={() => setShowVehicleDetails(!showVehicleDetails)}
                  className="flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2 font-bold text-dark-800 text-xs">
                    <Truck className="w-4 h-4 text-roo-500" />
                    <span>RV Rig Setup (Optional)</span>
                  </div>
                  <span className="text-[11px] font-bold text-roo-600">
                    {showVehicleDetails ? 'Collapse' : '+ Add Details'}
                  </span>
                </div>

                {showVehicleDetails && (
                  <div className="grid grid-cols-2 gap-2 pt-3 mt-2 border-t border-dark-200">
                    <div>
                      <label className="text-[10px] font-bold text-dark-500 block mb-1">RV Class</label>
                      <select
                        value={rvType}
                        onChange={e => setRvType(e.target.value as RVType)}
                        className="w-full h-9 px-2 rounded-xl border border-dark-200 bg-white text-xs font-medium text-dark-800"
                      >
                        {Object.entries(RV_TYPE_LABELS).map(([k, l]) => (
                          <option key={k} value={k}>{l}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-dark-500 block mb-1">Length (ft)</label>
                      <Input
                        type="number"
                        min={10}
                        max={45}
                        value={lengthFt}
                        onChange={e => setLengthFt(Number(e.target.value))}
                        className="h-9 rounded-xl text-xs font-medium border-dark-200"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Newsletter Opt-in Checkbox */}
              <div
                onClick={() => setNewsletterOptIn(!newsletterOptIn)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-2.5 select-none ${
                  newsletterOptIn
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-dark-900'
                    : 'bg-dark-50 border-dark-200 text-dark-500'
                }`}
              >
                <div
                  className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-all ${
                    newsletterOptIn
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'border-dark-300 bg-white'
                  }`}
                >
                  {newsletterOptIn && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <div className="text-xs leading-tight">
                  <div className="font-bold flex items-center gap-1.5 text-dark-900">
                    <Newspaper className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Weekly CampRoo Road Digest</span>
                  </div>
                  <div className="text-[10.5px] text-dark-500 mt-0.5">
                    Receive verified new free RV coordinates and boondocking tips every Thursday.
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 rounded-2xl bg-roo-500 hover:bg-roo-600 text-white font-bold text-xs shadow-md transition-all"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                <span>{isLoading ? 'Creating Account...' : 'Create Free Account'}</span>
              </Button>

              {/* Bottom Switcher */}
              <div className="text-center pt-1">
                <p className="text-xs text-dark-500">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setActiveTab('signin'); setErrorMessage(''); }}
                    className="text-roo-600 font-bold hover:underline"
                  >
                    Sign in here
                  </button>
                </p>
              </div>
            </form>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
};
