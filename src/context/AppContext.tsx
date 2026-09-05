import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  Spot,
  StayRequest,
  MessageThread,
  Review,
  CommunityPost,
  ReportItem,
  SearchFilterState,
  RVType,
  SpotEditRequest
} from '../types';
import { INITIAL_USERS } from '../data/initialUsers';
import { INITIAL_SPOTS } from '../data/initialSpots';
import { INITIAL_REQUESTS } from '../data/initialTripsAndRequests';
import { INITIAL_THREADS } from '../data/initialMessages';
import { INITIAL_REVIEWS } from '../data/initialReviews';
import { INITIAL_COMMUNITY_POSTS } from '../data/initialCommunity';
import { INITIAL_REPORTS } from '../data/initialReports';
import { api } from '../services/api';
import { createSupabaseSpot, deleteSupabaseSpot, fetchSupabaseSpots, updateSupabaseSpotPhotos } from '../lib/supabase';

interface AppContextType {
  currentUser: User;
  users: User[];
  spots: Spot[];
  requests: StayRequest[];
  threads: MessageThread[];
  reviews: Review[];
  communityPosts: CommunityPost[];
  reports: ReportItem[];
  searchFilters: SearchFilterState;
  currentView: string;
  selectedSpotId: string | null;
  activeThreadId: string | null;
  // Actions
  switchUser: (userId: string) => void;
  registerUser: (newUser: Omit<User, 'id' | 'rating' | 'reviewCount' | 'tripsCompleted' | 'spotsHosted' | 'joinedYear'>) => User;
  updateUserProfile: (updates: Partial<User>) => void;
  setCurrentView: (view: string) => void;
  setSelectedSpotId: (id: string | null) => void;
  setActiveThreadId: (id: string | null) => void;
  setSearchFilters: React.Dispatch<React.SetStateAction<SearchFilterState>>;
  resetFilters: () => void;
  submitStayRequest: (request: Omit<StayRequest, 'id' | 'createdAt' | 'status'>) => StayRequest;
  respondToStayRequest: (requestId: string, status: 'accepted' | 'declined', note?: string) => void;
  sendMessage: (threadId: string | null, recipientId: string, text: string, spotId?: string, stayRequestId?: string) => void;
  createSpot: (newSpot: Omit<Spot, 'id' | 'createdAt' | 'rating' | 'reviewCount' | 'isFree'>) => Spot;
  submitSpotWithReview: (
    newSpot: Omit<Spot, 'id' | 'createdAt' | 'rating' | 'reviewCount' | 'isFree'>,
    meta?: { submitterName?: string; submitterEmail?: string; submitterPhone?: string; visibility?: 'public' | 'personal'; notes?: string }
  ) => Promise<Spot>;
  deleteSpot: (spotId: string) => void;
  updateSpotStatus: (spotId: string, status: 'active' | 'paused') => void;
  addSpotPhotos: (spotId: string, photoUrls: string[]) => void;
  submitReview: (review: Omit<Review, 'id' | 'createdAt'>) => void;
  submitReport: (report: Omit<ReportItem, 'id' | 'createdAt' | 'status'>) => void;
  spotEditRequests: SpotEditRequest[];
  submitSpotEditRequest: (request: Omit<SpotEditRequest, 'id' | 'createdAt' | 'status'>) => void;
  blockUser: (userIdToBlock: string) => void;
  createCommunityPost: (post: Omit<CommunityPost, 'id' | 'createdAt' | 'upvotes' | 'upvotedBy' | 'comments'>) => void;
  toggleCommunityUpvote: (postId: string) => void;
  addCommunityComment: (postId: string, text: string) => void;
  // Saved / Liked Spots (Trips)
  savedSpotIds: string[];
  isSpotSaved: (spotId: string) => boolean;
  toggleSaveSpot: (spotId: string) => void;
  // Admin actions & security
  isAuthenticated: boolean;
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
  logout: () => void;
  isAdminAuthenticated: boolean;
  adminToken: string | null;
  adminLogin: (password: string, username?: string) => Promise<{ success: boolean; error?: string }>;
  adminLogout: () => void;
  adminToggleSuspendUser: (userId: string) => void;
  adminToggleFeatureSpot: (spotId: string) => void;
  adminResolveReport: (reportId: string, note?: string) => void;
  adminToggleVerifyUser: (userId: string, key: 'email' | 'phone' | 'idDocument' | 'rvOwnership') => void;
  // Geolocation & Target Map View
  userLocation: { lat: number; lng: number } | null;
  setUserLocation: (loc: { lat: number; lng: number } | null) => void;
  sortByDistance: boolean;
  setSortByDistance: (sort: boolean) => void;
  isLocating: boolean;
  handleNearMe: () => void;
  targetView: {
    center?: [number, number];
    zoom?: number;
    bounds?: {
      southWest: { lat: number; lng: number };
      northEast: { lat: number; lng: number };
    };
    timestamp: number;
  } | null;
  setTargetView: React.Dispatch<React.SetStateAction<{
    center?: [number, number];
    zoom?: number;
    bounds?: {
      southWest: { lat: number; lng: number };
      northEast: { lat: number; lng: number };
    };
    timestamp: number;
  } | null>>;
  // Support & Inquiries Modal
  isSupportModalOpen: boolean;
  setIsSupportModalOpen: (open: boolean) => void;
  openSupportModal: (topic?: string, subject?: string) => void;
  supportModalTopic: string;
  supportModalSubject: string;
}

const DEFAULT_FILTERS: SearchFilterState = {
  locationQuery: '',
  stateCode: 'all',
  landManager: 'all',
  environments: [],
  bathroomRequired: false,
  waterRequired: false,
  firePitRequired: false,
  trashRequired: false,
  featuredOnly: false,
};

const INITIAL_SPOT_IDS = new Set(INITIAL_SPOTS.map(s => s.id));

function getSanitizedUserSpots(): Spot[] {
  try {
    // Purge legacy caches that may contain duplicate or stock image spots
    localStorage.removeItem('camproo_spots_real_v3');
    localStorage.removeItem('camproo_spots');
    localStorage.removeItem('camproo_spots_v2');
    localStorage.removeItem('camproo_spots_v1');

    const raw = localStorage.getItem('camproo_user_spots');
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const seenIds = new Set<string>();
    const validSpots: Spot[] = [];

    for (const spot of parsed) {
      if (!spot || !spot.id) continue;
      // INITIAL_SPOTS and pipeline-import MUST NOT live in camproo_user_spots
      if (INITIAL_SPOT_IDS.has(spot.id) || spot.hostId === 'pipeline-import') continue;
      if (seenIds.has(spot.id)) continue;

      // Filter out any stock photos or deleted mock files
      const cleanPhotos = (spot.photos || []).filter(
        (p: string) =>
          typeof p === 'string' &&
          p.length > 0 &&
          !p.includes('unsplash.com') &&
          !p.includes('pexels.com') &&
          !p.includes('desert_spot.jpg') &&
          !p.includes('meadow_spot.jpg') &&
          !p.includes('hero_rv_camp.jpg')
      );

      if (cleanPhotos.length === 0) {
        cleanPhotos.push('/images/real_bald_mountain.jpg');
      }

      seenIds.add(spot.id);
      validSpots.push({
        ...spot,
        spotType: 'public',
        hostId: 'pipeline-import',
        photos: cleanPhotos,
      });
    }

    localStorage.setItem('camproo_user_spots', JSON.stringify(validSpots));
    return validSpots;
  } catch (e) {
    return [];
  }
}

export const GUEST_USER: User = {
  id: 'guest',
  name: 'Guest Roamer',
  role: 'traveler',
  email: '',
  phone: '',
  avatar: 'https://ui-avatars.com/api/?name=Guest+Roamer&background=64748b&color=fff&bold=true',
  bio: 'Roaming the open roads of America. Sign in to personalize your profile and save havens!',
  homeRegion: 'United States',
  yearsRVing: 0,
  rig: {
    type: 'class_c',
    makeModel: 'Camper Van / Rig',
    lengthFt: 25,
    year: 2024,
  },
  tripsCompleted: 0,
  spotsHosted: 0,
  joinedYear: 2026,
  rating: 5.0,
  reviewCount: 0,
  verifications: { email: false, phone: false, idDocument: false, rvOwnership: false },
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('camproo_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    const authStored = localStorage.getItem('camproo_is_authenticated');
    const saved = localStorage.getItem('camproo_current_user_id');
    if (authStored === 'true' && saved) return saved;
    return 'guest';
  });

  const [spots, setSpots] = useState<Spot[]>(() => {
    const userCreatedSpots = getSanitizedUserSpots();
    const map = new Map<string, Spot>();

    // 1. Add authentic host spots (INITIAL_SPOTS)
    INITIAL_SPOTS.forEach(s => map.set(s.id, s));

    // 2. Add genuine user-created spots
    userCreatedSpots.forEach(s => {
      if (!map.has(s.id)) map.set(s.id, s);
    });

    return Array.from(map.values());
  });

  const [requests, setRequests] = useState<StayRequest[]>(() => {
    try {
      const saved = localStorage.getItem('camproo_requests');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Purge legacy mock requests
          return parsed.filter(
            (r: any) => r && r.id !== 'req-moab-1' && r.id !== 'req-sedona-confirmed' && r.id !== 'req-bend-completed'
          );
        }
      }
    } catch (e) {}
    return [];
  });

  const [threads, setThreads] = useState<MessageThread[]>(() => {
    try {
      const saved = localStorage.getItem('camproo_threads');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Purge legacy mock threads
          return parsed.filter(
            (t: any) => t && t.id !== 'thread-moab-stay' && t.id !== 'thread-sedona-stay'
          );
        }
      }
    } catch (e) {}
    return [];
  });

  const [reviews, setReviews] = useState<Review[]>(() => {
    try {
      const saved = localStorage.getItem('camproo_reviews_v4');
      if (saved) return JSON.parse(saved);
      localStorage.removeItem('camproo_reviews');
    } catch {}
    return INITIAL_REVIEWS;
  });

  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>(() => {
    const saved = localStorage.getItem('camproo_community');
    return saved ? JSON.parse(saved) : INITIAL_COMMUNITY_POSTS;
  });

  const [reports, setReports] = useState<ReportItem[]>(() => {
    const saved = localStorage.getItem('camproo_reports');
    return saved ? JSON.parse(saved) : INITIAL_REPORTS;
  });

  const [spotEditRequests, setSpotEditRequests] = useState<SpotEditRequest[]>(() => {
    try {
      const saved = localStorage.getItem('camproo_spot_edits');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Support & Inquiries Modal state
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [supportModalTopic, setSupportModalTopic] = useState('General Support & Inquiry');
  const [supportModalSubject, setSupportModalSubject] = useState('');

  const openSupportModal = (topic = 'General Support & Inquiry', subject = '') => {
    setSupportModalTopic(topic);
    setSupportModalSubject(subject);
    setIsSupportModalOpen(true);
  };

  const [searchFilters, setSearchFilters] = useState<SearchFilterState>(DEFAULT_FILTERS);
  const [selectedSpotId, setSelectedSpotIdInternal] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const searchParams = new URLSearchParams(window.location.search);
      return searchParams.get('spot') || searchParams.get('id') || searchParams.get('spotId') || null;
    } catch (e) {
      return null;
    }
  });

  const [currentView, setCurrentViewInternal] = useState<string>(() => {
    if (typeof window === 'undefined') return 'home';
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const spotParam = searchParams.get('spot') || searchParams.get('id') || searchParams.get('spotId');
      if (spotParam) return 'spot-detail';
      const viewParam = searchParams.get('view')?.toLowerCase() || searchParams.get('v')?.toLowerCase();
      if (viewParam) return viewParam;
      if (searchParams.has('admin')) return 'admin';

      const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
      if (hash === 'admin' || hash === '/admin') return 'admin';
      if (hash) return hash;

      const path = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
      if (path === 'admin') return 'admin';
      if (path) return path;
    } catch (e) {
      // ignore
    }
    return 'home';
  });

  const setSelectedSpotId = (id: string | null) => {
    setSelectedSpotIdInternal(id);
    try {
      const url = new URL(window.location.href);
      if (id) {
        url.searchParams.set('spot', id);
        url.searchParams.set('view', 'spot-detail');
        url.hash = 'spot-detail';
        setCurrentViewInternal('spot-detail');
      } else {
        url.searchParams.delete('spot');
      }
      window.history.pushState({ view: id ? 'spot-detail' : currentView, spot: id }, '', url.toString());
    } catch (e) {
      // ignore
    }
  };

  const setCurrentView = (view: string) => {
    setCurrentViewInternal(view);
    try {
      const url = new URL(window.location.href);
      if (view === 'home') {
        url.searchParams.delete('view');
        url.searchParams.delete('spot');
        url.searchParams.delete('id');
        url.searchParams.delete('spotId');
        url.searchParams.delete('admin');
        url.hash = '';
        if (url.pathname === '/admin') {
          url.pathname = '/';
        }
      } else {
        url.searchParams.set('view', view);
        if (view !== 'spot-detail') {
          url.searchParams.delete('spot');
          url.searchParams.delete('id');
          url.searchParams.delete('spotId');
        } else if (selectedSpotId) {
          url.searchParams.set('spot', selectedSpotId);
        }
        url.hash = view;
      }
      window.history.pushState({ view, spot: selectedSpotId }, '', url.toString());
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    const handleUrlChange = () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const spotParam = searchParams.get('spot') || searchParams.get('id') || searchParams.get('spotId');
        if (spotParam) {
          setSelectedSpotIdInternal(spotParam);
          setCurrentViewInternal('spot-detail');
          return;
        }
        const viewParam = searchParams.get('view')?.toLowerCase() || searchParams.get('v')?.toLowerCase();
        if (viewParam) {
          setCurrentViewInternal(viewParam);
          return;
        }
        if (searchParams.has('admin')) {
          setCurrentViewInternal('admin');
          return;
        }

        const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
        if (hash === 'admin' || hash === '/admin') {
          setCurrentViewInternal('admin');
          return;
        }
        if (hash) {
          setCurrentViewInternal(hash);
          return;
        }

        const path = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
        if (path === 'admin') {
          setCurrentViewInternal('admin');
          return;
        }
        if (path) {
          setCurrentViewInternal(path);
          return;
        }
        setCurrentViewInternal('home');
      } catch (e) {
        // ignore
      }
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [sortByDistance, setSortByDistance] = useState(false);
  const [targetView, setTargetView] = useState<{
    center?: [number, number];
    zoom?: number;
    bounds?: {
      southWest: { lat: number; lng: number };
      northEast: { lat: number; lng: number };
    };
    timestamp: number;
  } | null>(null);

  const handleNearMe = () => {
    if (userLocation && sortByDistance) {
      setSortByDistance(false);
      return;
    }
    if (userLocation) {
      setSortByDistance(true);
      return;
    }
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(coords);
        setSortByDistance(true);
        setTargetView({
          center: [coords.lat, coords.lng],
          zoom: 9,
          timestamp: Date.now(),
        });
        if (currentView !== 'explore' && currentView !== 'home') {
          setCurrentView('explore');
        }
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation error:', err);
        alert('Could not detect your live GPS location. Please check browser permissions.');
      },
      { timeout: 9000, enableHighAccuracy: true }
    );
  };

  // Proactively auto-detect user location on first visit and load nearby havens
  useEffect(() => {
    // If already detected or user has an active search filter, preserve existing
    if (userLocation || searchFilters.locationQuery || searchFilters.searchCenter) return;

    let isMounted = true;

    const applyLocation = (lat: number, lng: number, isRegionalUS: boolean) => {
      if (!isMounted) return;
      const coords = { lat, lng };
      setUserLocation(coords);
      setSortByDistance(true);

      if (isRegionalUS) {
        // Center directly on user's location with proximity filter
        setSearchFilters((prev) => ({
          ...prev,
          searchCenter: [lat, lng],
          searchRadiusMiles: 60,
        }));
        setTargetView({
          center: [lat, lng],
          zoom: 9,
          timestamp: Date.now(),
        });
      } else {
        // Outside US/North America (e.g. overseas testing): keep user location for distance calculations
        // but default view to premier US hub (Denver / Rockies) so hundreds of spots are immediately available
        setTargetView({
          center: [39.7392, -104.9903],
          zoom: 7,
          timestamp: Date.now(),
        });
      }
    };

    // 1. Try Browser HTML5 Geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const inUS = lat >= 24 && lat <= 52 && lng >= -126 && lng <= -66;
          applyLocation(lat, lng, inUS);
        },
        () => {
          // 2. Geolocation denied or timed out: seamless IP geolocation fallback
          fetch('https://ipwho.is/')
            .then((res) => res.json())
            .then((data) => {
              if (data?.success && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
                const inUS = data.country_code === 'US' || (data.latitude >= 24 && data.latitude <= 52 && data.longitude >= -126 && data.longitude <= -66);
                applyLocation(data.latitude, data.longitude, inUS);
              }
            })
            .catch(() => {});
        },
        { timeout: 5000, enableHighAccuracy: false }
      );
    } else {
      // Direct IP fallback if browser doesn't support geolocation
      fetch('https://ipwho.is/')
        .then((res) => res.json())
        .then((data) => {
          if (data?.success && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
            const inUS = data.country_code === 'US' || (data.latitude >= 24 && data.latitude <= 52 && data.longitude >= -126 && data.longitude <= -66);
            applyLocation(data.latitude, data.longitude, inUS);
          }
        })
        .catch(() => {});
    }

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('camproo_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    try {
      const userCreatedSpots = spots.filter(
        s =>
          s.hostId !== 'pipeline-import' &&
          !INITIAL_SPOT_IDS.has(s.id) &&
          (s.id.startsWith('spot-user-') ||
            s.id.startsWith('user-created-') ||
            s.id.startsWith('spot-submit-') ||
            (s as any).visibility === 'personal' ||
            s.hostId === currentUserId)
      );
      localStorage.setItem('camproo_user_spots', JSON.stringify(userCreatedSpots));
    } catch (e) {}
  }, [spots, currentUserId]);

  useEffect(() => {
    localStorage.setItem('camproo_requests', JSON.stringify(requests));
  }, [requests]);

  useEffect(() => {
    localStorage.setItem('camproo_threads', JSON.stringify(threads));
  }, [threads]);

  useEffect(() => {
    localStorage.setItem('camproo_reviews', JSON.stringify(reviews));
  }, [reviews]);

  useEffect(() => {
    localStorage.setItem('camproo_community', JSON.stringify(communityPosts));
  }, [communityPosts]);

  useEffect(() => {
    localStorage.setItem('camproo_reports', JSON.stringify(reports));
  }, [reports]);

  useEffect(() => {
    localStorage.setItem('camproo_current_user_id', currentUserId);
  }, [currentUserId]);

  // Saved / Liked Spots State (Trips) - User scoped with fresh start
  const [savedSpotIds, setSavedSpotIds] = useState<string[]>(() => {
    try {
      const savedId = localStorage.getItem('camproo_current_user_id') || 'guest';
      const userKey = `camproo_saved_spot_ids_${savedId}`;
      const stored = localStorage.getItem(userKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  useEffect(() => {
    try {
      const userKey = `camproo_saved_spot_ids_${currentUserId}`;
      localStorage.setItem(userKey, JSON.stringify(savedSpotIds));
      localStorage.setItem('camproo_saved_spot_ids', JSON.stringify(savedSpotIds));
    } catch (e) {}
  }, [savedSpotIds, currentUserId]);

  // Sync saved spots from backend or user key on mount or user switch
  useEffect(() => {
    if (!currentUserId || currentUserId === 'guest') {
      setSavedSpotIds([]);
      return;
    }
    const userKey = `camproo_saved_spot_ids_${currentUserId}`;
    const stored = localStorage.getItem(userKey);
    if (stored) {
      try {
        setSavedSpotIds(JSON.parse(stored));
      } catch (e) {}
    } else {
      setSavedSpotIds([]);
    }

    fetch(`/api/spots/saved/${currentUserId}`)
      .then(r => r.json())
      .then(data => {
        if (data && data.success && Array.isArray(data.savedSpotIds)) {
          setSavedSpotIds(prev => Array.from(new Set([...prev, ...data.savedSpotIds])));
        }
      })
      .catch(() => {});
  }, [currentUserId]);

  const isSpotSaved = (spotId: string) => savedSpotIds.includes(spotId);

  const toggleSaveSpot = (spotId: string) => {
    const isCurrentlySaved = savedSpotIds.includes(spotId);
    const updated = isCurrentlySaved
      ? savedSpotIds.filter(id => id !== spotId)
      : [...savedSpotIds, spotId];

    setSavedSpotIds(updated);

    // Sync to backend asynchronously if user is signed in
    if (currentUserId && currentUserId !== 'guest') {
      const endpoint = isCurrentlySaved ? '/api/spots/unsave' : '/api/spots/save';
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId, spotId })
      }).catch(err => console.warn('Failed to sync saved spot to backend:', err));
    }
  };

  // Admin security state (Restricted strictly to admin aziz with password 94883443@Aa)
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    return localStorage.getItem('camproo_admin_token') || sessionStorage.getItem('camproo_admin_token') || null;
  });

  const isAdminAuthenticated = Boolean(adminToken);

  // General user authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const authStored = localStorage.getItem('camproo_is_authenticated');
    const adminTokenStored = localStorage.getItem('camproo_admin_token') || sessionStorage.getItem('camproo_admin_token');
    return authStored === 'true' || Boolean(adminTokenStored);
  });

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('camproo_is_authenticated');
    setAdminToken(null);
    localStorage.removeItem('camproo_admin_token');
    sessionStorage.removeItem('camproo_admin_token');
    localStorage.removeItem('camproo_current_user_id');
    setCurrentUserId('guest');
    setSavedSpotIds([]);
    setRequests([]);
    setThreads([]);
  };

  const adminLogin = async (password: string, username = 'aziz') => {
    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminToken(data.token);
        localStorage.setItem('camproo_admin_token', data.token);
        setIsAuthenticated(true);
        localStorage.setItem('camproo_is_authenticated', 'true');
        if (data.user) {
          registerUser(data.user);
          switchUser(data.user.id);
        }
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Invalid credentials' };
      }
    } catch (err: any) {
      if (username.toLowerCase().trim() === 'aziz' && password === '94883443@Aa') {
        const token = 'camproo_admin_sec_94883443_aziz';
        setAdminToken(token);
        localStorage.setItem('camproo_admin_token', token);
        setIsAuthenticated(true);
        localStorage.setItem('camproo_is_authenticated', 'true');
        const admin = users.find(u => u.role === 'admin' || u.email.includes('aziz')) || INITIAL_USERS.find(u => u.id === 'user-admin');
        if (admin) switchUser(admin.id);
        return { success: true };
      }
      return { success: false, error: 'Invalid admin credentials' };
    }
  };

  const adminLogout = () => {
    logout();
  };

  // Hydrate initial state: merge Supabase spots without overwriting the nationwide spots
  useEffect(() => {
    let isMounted = true;
    
    // Asynchronously load compact curated spots from public data in 4 chunks (<2.5MB each)
    const partUrls = Array.from({ length: 4 }, (_, i) => `/data/curatedFreeSpots_part${i + 1}.json`);
    Promise.all(
      partUrls.map(url => fetch(url).then(r => (r.ok ? r.json() : [])).catch(() => []))
    ).then((parts) => {
      const curated = parts.flat();
      if (isMounted && curated.length > 0) {
        setSpots(prev => {
          const map = new Map<string, Spot>();
          prev.forEach(s => map.set(s.id, s));
          (curated as any[]).forEach(s => {
            if (!map.has(s.id)) {
              const cleanPhotos = (s.photos || []).filter(
                (p: string) => typeof p === 'string' && !p.includes('unsplash.com') && !p.includes('pexels.com')
              );
              const hydratedSpot: Spot = {
                id: s.id,
                hostId: s.hostId || 'pipeline-import',
                title: s.title || s.locationName || 'Free Dispersed Spot',
                tagline: s.tagline || `Free USFS/BLM Camping — ${s.generalArea || 'USA'}`,
                description: s.description || s.title || 'Free public lands dispersed camping spot.',
                locationName: s.locationName || s.title,
                generalArea: s.generalArea || 'USA',
                coordinates: s.coordinates || [39.5, -98.35],
                photos: cleanPhotos.length > 0 ? cleanPhotos : ['/images/real_bald_mountain.jpg'],
                spaceType: s.spaceType || 'forest_clearing',
                environment: s.environment || 'forest',
                rigCompatibility: s.rigCompatibility || {
                  maxLengthFt: 35,
                  maxHeightFt: 13.5,
                  maxWidthFt: 8.5,
                  acceptedTypes: ['class_b', 'class_c', 'campervan', 'truck_camper', 'rooftop_tent', 'travel_trailer'],
                  accessType: 'back_in',
                  surfaceType: 'dirt',
                  isLevel: false,
                  turnaroundSpace: 'Forest / BLM access clearing',
                  trailerDisconnectRequired: false
                },
                amenities: s.amenities || {
                  electricity: 'none',
                  water: 'none',
                  sewer: 'none',
                  wifi: false,
                  bathroom: false,
                  shower: false,
                  firePit: false,
                  trash: false,
                  shade: 'partial',
                  generatorsAllowed: true,
                  petsAllowed: true,
                  familyFriendly: true,
                  quietSetting: true,
                  offGridCapable: true
                },
                proximity: s.proximity || {
                  fuelNearbyMiles: 0,
                  groceriesNearbyMiles: 0,
                  rvDumpNearbyMiles: 0,
                  attractionNote: 'Scenic public lands area'
                },
                rules: s.rules || {
                  maxStayNights: 14,
                  checkInWindow: 'Anytime',
                  checkOutTime: 'Anytime',
                  quietHours: 'Respect other campers',
                  campfirePolicy: 'Check local fire restrictions',
                  childrenAllowed: true,
                  extraGuestsAllowed: true,
                  hostInteraction: 'independent_gate_code'
                },
                gatekeeping: 'any_member',
                rating: s.rating ?? 0,
                reviewCount: s.reviewCount ?? 0,
                isFree: true,
                isFeatured: s.isFeatured ?? true,
                status: s.status || 'active',
                createdAt: s.createdAt || '2026-09-04'
              };
              map.set(s.id, hydratedSpot);
            }
          });
          return Array.from(map.values());
        });
      }
    }).catch(() => {});

    // Fetch live spots from Supabase
    fetchSupabaseSpots({ limit: 1000 }).then(supabaseSpots => {
      if (isMounted && supabaseSpots && supabaseSpots.length > 0) {
        setSpots(prev => {
          const map = new Map<string, Spot>();
          prev.forEach(s => map.set(s.id, s));
          supabaseSpots.forEach(s => {
            if (!map.has(s.id)) {
              const cleanPhotos = (s.photos || []).filter(
                (p: string) => typeof p === 'string' && !p.includes('unsplash.com') && !p.includes('pexels.com')
              );
              map.set(s.id, {
                ...s,
                photos: cleanPhotos.length > 0 ? cleanPhotos : ['/images/real_bald_mountain.jpg']
              });
            }
          });
          return Array.from(map.values());
        });
      }
    }).catch(() => {});

    api.getUsers().then(serverUsers => {
      if (isMounted && serverUsers && serverUsers.length > 0) setUsers(serverUsers);
    }).catch(() => {});

    // Only load user's requests and threads if authenticated
    if (currentUserId && currentUserId !== 'guest') {
      api.getRequests({ travelerId: currentUserId }).then(serverReqs => {
        if (isMounted && Array.isArray(serverReqs)) setRequests(serverReqs);
      }).catch(() => {});

      api.getThreads(currentUserId).then(serverThreads => {
        if (isMounted && Array.isArray(serverThreads)) setThreads(serverThreads);
      }).catch(() => {});
    }

    api.getPosts().then(serverPosts => {
      if (isMounted && serverPosts && serverPosts.length > 0) setCommunityPosts(serverPosts);
    }).catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [currentUserId]);

  const currentUser = (currentUserId !== 'guest' ? users.find(u => u.id === currentUserId) : null) || GUEST_USER;

  const switchUser = (userId: string) => {
    setCurrentUserId(userId);
    if (userId && userId !== 'guest') {
      setIsAuthenticated(true);
      localStorage.setItem('camproo_is_authenticated', 'true');
      localStorage.setItem('camproo_current_user_id', userId);
    } else {
      setIsAuthenticated(false);
      localStorage.removeItem('camproo_is_authenticated');
      localStorage.removeItem('camproo_current_user_id');
    }
  };

  const updateUserProfile = (updates: Partial<User>) => {
    if (!currentUser || currentUser.id === 'guest') return;
    const updatedUser: User = {
      ...currentUser,
      ...updates,
      rig: {
        ...currentUser.rig,
        ...(updates.rig || {})
      },
      verifications: {
        ...currentUser.verifications,
        ...(updates.verifications || {})
      }
    };

    setUsers(prev => {
      const nextUsers = prev.map(u => (u.id === currentUser.id ? updatedUser : u));
      try {
        localStorage.setItem('camproo_users', JSON.stringify(nextUsers));
      } catch (e) {}
      return nextUsers;
    });

    api.updateUser(currentUser.id, updatedUser).catch(() => {});
  };

  const registerUser = (newUserData: Omit<User, 'id' | 'rating' | 'reviewCount' | 'tripsCompleted' | 'spotsHosted' | 'joinedYear'>): User => {
    const newUser: User = {
      ...newUserData,
      id: `user-${Date.now()}`,
      rating: 5.0,
      reviewCount: 0,
      tripsCompleted: 0,
      spotsHosted: 0,
      joinedYear: new Date().getFullYear(),
    };
    setUsers(prev => [newUser, ...prev]);
    setCurrentUserId(newUser.id);
    setIsAuthenticated(true);
    localStorage.setItem('camproo_is_authenticated', 'true');
    localStorage.setItem('camproo_current_user_id', newUser.id);
    setSavedSpotIds([]);
    setRequests([]);
    setThreads([]);
    api.registerUser(newUser).catch(() => {});
    return newUser;
  };

  const resetFilters = () => {
    setSearchFilters(DEFAULT_FILTERS);
  };

  const submitStayRequest = (reqData: Omit<StayRequest, 'id' | 'createdAt' | 'status'>): StayRequest => {
    const newReq: StayRequest = {
      ...reqData,
      id: `req-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    setRequests(prev => [newReq, ...prev]);

    const spot = spots.find(s => s.id === reqData.spotId);
    const existingThread = threads.find(
      t => (t.participants.includes(reqData.travelerId) && t.participants.includes(reqData.hostId))
    );

    if (existingThread) {
      const newMsg = {
        id: `msg-${Date.now()}`,
        threadId: existingThread.id,
        senderId: reqData.travelerId,
        text: `New Stay Request for ${reqData.arrivalDate} to ${reqData.departureDate} (${reqData.nights} nights). Note: "${reqData.personalNote}"`,
        timestamp: new Date().toISOString(),
      };
      setThreads(prev =>
        prev.map(t =>
          t.id === existingThread.id
            ? {
                ...t,
                lastMessage: newMsg.text,
                lastMessageAt: newMsg.timestamp,
                stayRequestId: newReq.id,
                messages: [...t.messages, newMsg],
                unreadBy: [reqData.hostId],
              }
            : t
        )
      );
    } else {
      const newThread: MessageThread = {
        id: `thread-${Date.now()}`,
        participants: [reqData.travelerId, reqData.hostId],
        spotId: reqData.spotId,
        stayRequestId: newReq.id,
        lastMessage: `Stay request submitted for ${reqData.arrivalDate} (${reqData.nights} nights)`,
        lastMessageAt: new Date().toISOString(),
        unreadBy: [reqData.hostId],
        messages: [
          {
            id: `msg-${Date.now()}`,
            threadId: `thread-${Date.now()}`,
            senderId: reqData.travelerId,
            text: `Hi! We submitted a stay request for ${spot?.title || 'your spot'}. "${reqData.personalNote}"`,
            timestamp: new Date().toISOString(),
          }
        ],
      };
      setThreads(prev => [newThread, ...prev]);
    }

    const enrichedReq = {
      ...newReq,
      travelerName: currentUser.name,
      travelerEmail: currentUser.email,
      spotTitle: spot?.title || 'RV Spot',
      spotLocation: [spot?.locationName, spot?.generalArea].filter(Boolean).join(', ') || 'USA',
      rigDescription: `${reqData.travelerRig?.lengthFt || 25}ft ${reqData.travelerRig?.description || reqData.travelerRig?.type || 'Rig'}`
    };
    api.createRequest(enrichedReq as any).catch(() => {});

    return newReq;
  };

  const respondToStayRequest = (requestId: string, status: 'accepted' | 'declined', note?: string) => {
    const finalNote = note || (status === 'accepted' ? 'Your stay request has been warmly accepted! Looking forward to hosting you.' : 'Sorry, we are unavailable on those dates.');

    setRequests(prev =>
      prev.map(r => {
        if (r.id === requestId) {
          return {
            ...r,
            status,
            hostResponseNote: finalNote,
          };
        }
        return r;
      })
    );

    api.updateRequest(requestId, {
      status,
      hostResponseNote: finalNote,
    }).catch(() => {});

    const req = requests.find(r => r.id === requestId);
    if (req) {
      const thread = threads.find(
        t => t.stayRequestId === requestId || (t.participants.includes(req.travelerId) && t.participants.includes(req.hostId))
      );
      if (thread) {
        const text = status === 'accepted'
          ? `🎉 Stay Request ACCEPTED! Host message: "${finalNote}"`
          : `Stay Request was declined: "${finalNote}"`;
        sendMessage(thread.id, req.travelerId, text, req.spotId, req.id);
      }
    }
  };

  const sendMessage = (
    threadId: string | null,
    recipientId: string,
    text: string,
    spotId?: string,
    stayRequestId?: string
  ) => {
    const timestamp = new Date().toISOString();
    const newMsgId = `msg-${Date.now()}`;

    if (threadId) {
      setThreads(prev =>
        prev.map(t => {
          if (t.id === threadId) {
            return {
              ...t,
              lastMessage: text,
              lastMessageAt: timestamp,
              unreadBy: [recipientId],
              messages: [
                ...t.messages,
                {
                  id: newMsgId,
                  threadId,
                  senderId: currentUser.id,
                  text,
                  timestamp,
                }
              ]
            };
          }
          return t;
        })
      );
      api.sendMessage(threadId, { senderId: currentUser.id, text }).catch(() => {});
    } else {
      const newThreadId = `thread-${Date.now()}`;
      const newThread: MessageThread = {
        id: newThreadId,
        participants: [currentUser.id, recipientId],
        spotId: spotId || '',
        stayRequestId,
        lastMessage: text,
        lastMessageAt: timestamp,
        unreadBy: [recipientId],
        messages: [
          {
            id: newMsgId,
            threadId: newThreadId,
            senderId: currentUser.id,
            text,
            timestamp,
          }
        ]
      };
      setThreads(prev => [newThread, ...prev]);
      setActiveThreadId(newThreadId);
      api.createThread({ participants: [currentUser.id, recipientId], spotId, messages: [{ senderId: currentUser.id, text }] } as any).catch(() => {});
    }
  };

  const createSpot = (newSpotData: Omit<Spot, 'id' | 'createdAt' | 'rating' | 'reviewCount' | 'isFree'>): Spot => {
    const visibility = newSpotData.visibility || 'public';
    const newSpot: Spot = {
      ...newSpotData,
      id: `spot-${Date.now()}`,
      isFree: true,
      rating: 5.0,
      reviewCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'active',
      visibility,
      reviewStatus: visibility === 'personal' ? 'personal' : 'pending_review',
      submitterName: newSpotData.submitterName || currentUser.name,
      contactEmail: newSpotData.contactEmail || currentUser.email,
      contactPhone: newSpotData.contactPhone || currentUser.phone,
    };
    setSpots(prev => [newSpot, ...prev]);
    setUsers(prev =>
      prev.map(u => (u.id === newSpotData.hostId ? { ...u, spotsHosted: u.spotsHosted + 1 } : u))
    );
    api.submitSpot({
      spot: newSpot,
      submitterName: newSpot.submitterName,
      submitterEmail: newSpot.contactEmail,
      submitterPhone: newSpot.contactPhone,
      visibility,
    }).catch(() => {
      api.createSpot(newSpot).catch(() => {});
    });
    createSupabaseSpot(newSpot).catch(() => {});
    return newSpot;
  };

  const submitSpotWithReview = async (
    newSpotData: Omit<Spot, 'id' | 'createdAt' | 'rating' | 'reviewCount' | 'isFree'>,
    meta?: { submitterName?: string; submitterEmail?: string; submitterPhone?: string; visibility?: 'public' | 'personal'; notes?: string }
  ): Promise<Spot> => {
    const visibility = meta?.visibility || newSpotData.visibility || 'public';
    const newSpot: Spot = {
      ...newSpotData,
      id: `spot-${Date.now()}`,
      isFree: true,
      rating: 5.0,
      reviewCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'active',
      visibility,
      reviewStatus: visibility === 'personal' ? 'personal' : 'pending_review',
      submitterName: meta?.submitterName || newSpotData.submitterName || currentUser.name,
      contactEmail: meta?.submitterEmail || newSpotData.contactEmail || currentUser.email,
      contactPhone: meta?.submitterPhone || newSpotData.contactPhone || currentUser.phone,
    };
    setSpots(prev => [newSpot, ...prev]);
    setUsers(prev =>
      prev.map(u => (u.id === newSpotData.hostId ? { ...u, spotsHosted: u.spotsHosted + 1 } : u))
    );
    try {
      await api.submitSpot({
        spot: newSpot,
        submitterName: newSpot.submitterName,
        submitterEmail: newSpot.contactEmail,
        submitterPhone: newSpot.contactPhone,
        visibility,
        notes: meta?.notes || '',
      });
    } catch (e) {
      console.warn('[AppContext] Falling back to standard spot save:', e);
      api.createSpot(newSpot).catch(() => {});
    }
    createSupabaseSpot(newSpot).catch(() => {});
    return newSpot;
  };

  const deleteSpot = (spotId: string) => {
    setSpots(prev => prev.filter(s => s.id !== spotId));
    api.deleteSpot(spotId).catch(() => {});
    deleteSupabaseSpot(spotId).catch(() => {});
  };

  const updateSpotStatus = (spotId: string, status: 'active' | 'paused') => {
    setSpots(prev => prev.map(s => (s.id === spotId ? { ...s, status } : s)));
  };

  const addSpotPhotos = (spotId: string, newPhotoUrls: string[]) => {
    if (!newPhotoUrls || newPhotoUrls.length === 0) return;

    // Filter out any stock photos strictly
    const cleanUrls = newPhotoUrls.filter(u => u && !u.includes('unsplash.com') && !u.includes('pexels.com'));
    if (cleanUrls.length === 0) return;

    setSpots(prev =>
      prev.map(s => {
        if (s.id === spotId) {
          const updatedPhotos = [...cleanUrls, ...(s.photos || [])];
          return {
            ...s,
            photos: updatedPhotos,
          };
        }
        return s;
      })
    );

    // Save to local custom photo overrides
    try {
      const savedOverrides = localStorage.getItem('camproo_custom_photos');
      const photoOverrides: Record<string, string[]> = savedOverrides ? JSON.parse(savedOverrides) : {};
      photoOverrides[spotId] = [...cleanUrls, ...(photoOverrides[spotId] || [])];
      localStorage.setItem('camproo_custom_photos', JSON.stringify(photoOverrides));
    } catch (e) {}

    // Update in Supabase
    updateSupabaseSpotPhotos(spotId, cleanUrls).catch(() => {});
  };

  const submitReview = (reviewData: Omit<Review, 'id' | 'createdAt'>) => {
    const newReview: Review = {
      ...reviewData,
      id: `rev-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setReviews(prev => [newReview, ...prev]);

    if (reviewData.spotId) {
      const reviewPhotos = reviewData.photos?.filter(p => p && p.trim().length > 0) || [];

      setSpots(prev =>
        prev.map(s => {
          if (s.id === reviewData.spotId) {
            const newCount = s.reviewCount + 1;
            const newRating = Number(((s.rating * s.reviewCount + reviewData.ratingOverall) / newCount).toFixed(2));
            const mergedPhotos = reviewPhotos.length > 0
              ? [...s.photos, ...reviewPhotos.filter(p => !s.photos.includes(p))]
              : s.photos;

            return {
              ...s,
              rating: newRating,
              reviewCount: newCount,
              photos: mergedPhotos,
            };
          }
          return s;
        })
      );

      // Persist photos to Supabase if any
      if (reviewPhotos.length > 0) {
        updateSupabaseSpotPhotos(reviewData.spotId, reviewPhotos).catch(() => {});
      }
    }
    const spot = reviewData.spotId ? spots.find(s => s.id === reviewData.spotId) : null;
    api.createReview({
      ...newReview,
      reviewerName: currentUser.name,
      spotTitle: spot?.title || 'RV Spot',
    } as any).catch(() => {});
  };

  const submitSpotEditRequest = (requestData: Omit<SpotEditRequest, 'id' | 'createdAt' | 'status'>) => {
    const newRequest: SpotEditRequest = {
      ...requestData,
      id: `edit-req-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    setSpotEditRequests(prev => {
      const updated = [newRequest, ...prev];
      try {
        localStorage.setItem('camproo_spot_edits', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Also dispatch to API if endpoint available
    try {
      fetch(`/api/spots/${requestData.spotId}/edit-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRequest),
      }).catch(() => {});
    } catch {}
  };

  const submitReport = (reportData: Omit<ReportItem, 'id' | 'createdAt' | 'status'>) => {
    const newReport: ReportItem = {
      ...reportData,
      id: `rep-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    setReports(prev => [newReport, ...prev]);
    api.createReport({
      ...newReport,
      reporterName: currentUser.name,
      reporterEmail: currentUser.email,
      targetType: reportData.reportedTargetType,
      targetName: reportData.targetName,
    } as any).catch(() => {});
  };

  const blockUser = (userIdToBlock: string) => {
    setUsers(prev =>
      prev.map(u => {
        if (u.id === currentUser.id) {
          const currentBlocked = u.blockedUserIds || [];
          return {
            ...u,
            blockedUserIds: currentBlocked.includes(userIdToBlock) ? currentBlocked : [...currentBlocked, userIdToBlock]
          };
        }
        return u;
      })
    );
  };

  const createCommunityPost = (postData: Omit<CommunityPost, 'id' | 'createdAt' | 'upvotes' | 'upvotedBy' | 'comments'>) => {
    const newPost: CommunityPost = {
      ...postData,
      id: `post-${Date.now()}`,
      upvotes: 0,
      upvotedBy: [],
      comments: [],
      createdAt: new Date().toISOString(),
    };
    setCommunityPosts(prev => [newPost, ...prev]);
    api.createPost(newPost).catch(() => {});
  };

  const toggleCommunityUpvote = (postId: string) => {
    setCommunityPosts(prev =>
      prev.map(p => {
        if (p.id === postId) {
          const hasUpvoted = p.upvotedBy.includes(currentUser.id);
          const newUpvotedBy = hasUpvoted
            ? p.upvotedBy.filter(id => id !== currentUser.id)
            : [...p.upvotedBy, currentUser.id];
          return {
            ...p,
            upvotes: newUpvotedBy.length,
            upvotedBy: newUpvotedBy,
          };
        }
        return p;
      })
    );
  };

  const addCommunityComment = (postId: string, text: string) => {
    const newComment = {
      id: `c-${Date.now()}`,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatar,
      authorRig: `${currentUser.rig.lengthFt}ft ${currentUser.rig.makeModel || 'Rig'}`,
      content: text,
      createdAt: new Date().toISOString(),
    };
    setCommunityPosts(prev =>
      prev.map(p => (p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p))
    );
    api.addComment(postId, newComment).catch(() => {});
  };

  const adminToggleSuspendUser = (userId: string) => {
    setUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, isSuspended: !u.isSuspended } : u))
    );
  };

  const adminToggleFeatureSpot = (spotId: string) => {
    setSpots(prev =>
      prev.map(s => (s.id === spotId ? { ...s, isFeatured: !s.isFeatured } : s))
    );
  };

  const adminResolveReport = (reportId: string, note?: string) => {
    setReports(prev =>
      prev.map(r => (r.id === reportId ? { ...r, status: 'resolved', adminNotes: note || 'Resolved by Ranger admin' } : r))
    );
  };

  const adminToggleVerifyUser = (userId: string, key: 'email' | 'phone' | 'idDocument' | 'rvOwnership') => {
    setUsers(prev =>
      prev.map(u => {
        if (u.id === userId) {
          return {
            ...u,
            verifications: {
              ...u.verifications,
              [key]: !u.verifications[key]
            }
          };
        }
        return u;
      })
    );
  };

  const synchronizedSpots = spots.map(spot => {
    const spotRevs = reviews.filter(r => r.spotId === spot.id);
    if (spotRevs.length === 0) {
      return {
        ...spot,
        reviewCount: 0,
        rating: spot.rating > 0 ? spot.rating : 5.0,
      };
    }
    const avg = spotRevs.reduce((sum, r) => sum + (r.ratingOverall || (r as any).rating || 5), 0) / spotRevs.length;
    return {
      ...spot,
      reviewCount: spotRevs.length,
      rating: Number(avg.toFixed(2)),
    };
  });

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        spots: synchronizedSpots,
        requests,
        threads,
        reviews,
        communityPosts,
        reports,
        searchFilters,
        currentView,
        selectedSpotId,
        activeThreadId,
        switchUser,
        registerUser,
        updateUserProfile,
        setCurrentView,
        setSelectedSpotId,
        setActiveThreadId,
        setSearchFilters,
        resetFilters,
        submitStayRequest,
        respondToStayRequest,
        sendMessage,
        createSpot,
        submitSpotWithReview,
        deleteSpot,
        updateSpotStatus,
        addSpotPhotos,
        submitReview,
        submitReport,
        spotEditRequests,
        submitSpotEditRequest,
        blockUser,
        createCommunityPost,
        toggleCommunityUpvote,
        addCommunityComment,
        savedSpotIds,
        isSpotSaved,
        toggleSaveSpot,
        adminToggleSuspendUser,
        adminToggleFeatureSpot,
        adminResolveReport,
        adminToggleVerifyUser,
        isAuthenticated,
        setIsAuthenticated,
        logout,
        isAdminAuthenticated,
        adminToken,
        adminLogin,
        adminLogout,
        userLocation,
        setUserLocation,
        sortByDistance,
        setSortByDistance,
        isLocating,
        handleNearMe,
        targetView,
        setTargetView,
        isSupportModalOpen,
        setIsSupportModalOpen,
        openSupportModal,
        supportModalTopic,
        supportModalSubject,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
