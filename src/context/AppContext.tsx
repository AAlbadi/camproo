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
  RVType
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
  setCurrentView: (view: string) => void;
  setSelectedSpotId: (id: string | null) => void;
  setActiveThreadId: (id: string | null) => void;
  setSearchFilters: React.Dispatch<React.SetStateAction<SearchFilterState>>;
  resetFilters: () => void;
  submitStayRequest: (request: Omit<StayRequest, 'id' | 'createdAt' | 'status'>) => StayRequest;
  respondToStayRequest: (requestId: string, status: 'accepted' | 'declined', note?: string) => void;
  sendMessage: (threadId: string | null, recipientId: string, text: string, spotId?: string, stayRequestId?: string) => void;
  createSpot: (newSpot: Omit<Spot, 'id' | 'createdAt' | 'rating' | 'reviewCount' | 'isFree'>) => Spot;
  deleteSpot: (spotId: string) => void;
  updateSpotStatus: (spotId: string, status: 'active' | 'paused') => void;
  addSpotPhotos: (spotId: string, photoUrls: string[]) => void;
  submitReview: (review: Omit<Review, 'id' | 'createdAt'>) => void;
  submitReport: (report: Omit<ReportItem, 'id' | 'createdAt' | 'status'>) => void;
  blockUser: (userIdToBlock: string) => void;
  createCommunityPost: (post: Omit<CommunityPost, 'id' | 'createdAt' | 'upvotes' | 'upvotedBy' | 'comments'>) => void;
  toggleCommunityUpvote: (postId: string) => void;
  addCommunityComment: (postId: string, text: string) => void;
  // Admin actions
  adminToggleSuspendUser: (userId: string) => void;
  adminToggleFeatureSpot: (spotId: string) => void;
  adminResolveReport: (reportId: string, note?: string) => void;
  adminToggleVerifyUser: (userId: string, key: 'email' | 'phone' | 'idDocument' | 'rvOwnership') => void;
}

const DEFAULT_FILTERS: SearchFilterState = {
  locationQuery: '',
  arrivalDate: '',
  departureDate: '',
  rvType: 'any',
  minLengthFt: 15,
  maxLengthFt: 45,
  isFreeOnly: true,
  electricRequired: 'any',
  waterRequired: false,
  sewerRequired: false,
  wifiRequired: false,
  petsAllowed: false,
  campfireAllowed: false,
  generatorAllowed: false,
  familyFriendlyOnly: false,
  quietOnly: false,
  offGridOnly: false,
  pullThroughOnly: false,
  levelGroundOnly: false,
  environments: [],
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('camproo_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    return localStorage.getItem('camproo_current_user_id') || 'user-traveler-1';
  });

  const [spots, setSpots] = useState<Spot[]>(() => {
    // Clear legacy small cache to ensure nationwide 9,777 spots load
    try {
      localStorage.removeItem('camproo_spots_real_v3');
      localStorage.removeItem('camproo_spots');
    } catch (e) {}

    // Load user created spots
    let userCreatedSpots: Spot[] = [];
    try {
      const savedUserSpots = localStorage.getItem('camproo_user_spots');
      if (savedUserSpots) userCreatedSpots = JSON.parse(savedUserSpots);
    } catch (e) {}

    return [...userCreatedSpots, ...INITIAL_SPOTS];
  });

  const [requests, setRequests] = useState<StayRequest[]>(() => {
    const saved = localStorage.getItem('camproo_requests');
    return saved ? JSON.parse(saved) : INITIAL_REQUESTS;
  });

  const [threads, setThreads] = useState<MessageThread[]>(() => {
    const saved = localStorage.getItem('camproo_threads');
    return saved ? JSON.parse(saved) : INITIAL_THREADS;
  });

  const [reviews, setReviews] = useState<Review[]>(() => {
    const saved = localStorage.getItem('camproo_reviews');
    return saved ? JSON.parse(saved) : INITIAL_REVIEWS;
  });

  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>(() => {
    const saved = localStorage.getItem('camproo_community');
    return saved ? JSON.parse(saved) : INITIAL_COMMUNITY_POSTS;
  });

  const [reports, setReports] = useState<ReportItem[]>(() => {
    const saved = localStorage.getItem('camproo_reports');
    return saved ? JSON.parse(saved) : INITIAL_REPORTS;
  });

  const [searchFilters, setSearchFilters] = useState<SearchFilterState>(DEFAULT_FILTERS);
  const [currentView, setCurrentView] = useState<string>('home');
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('camproo_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    try {
      const userCreatedSpots = spots.filter(s => s.hostId !== 'pipeline-import');
      localStorage.setItem('camproo_user_spots', JSON.stringify(userCreatedSpots));
    } catch (e) {}
  }, [spots]);

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

  // Hydrate initial state: merge Supabase spots without overwriting the nationwide spots
  useEffect(() => {
    let isMounted = true;
    
    // Asynchronously load curated spots from public data (non-blocking)
    fetch('/data/curatedFreeSpots.json')
      .then(r => r.ok ? r.json() : null)
      .then(curated => {
        if (isMounted && curated && Array.isArray(curated)) {
          setSpots(prev => {
            const existingIds = new Set(prev.map(s => s.id));
            const newSpots = (curated as Spot[]).filter(s => !existingIds.has(s.id));
            return [...prev, ...newSpots];
          });
        }
      })
      .catch(() => {});

    // Fetch live spots from Supabase
    fetchSupabaseSpots({ limit: 1000 }).then(supabaseSpots => {
      if (isMounted && supabaseSpots && supabaseSpots.length > 0) {
        setSpots(prev => {
          const existingIds = new Set(prev.map(s => s.id));
          const newSpots = supabaseSpots.filter(s => !existingIds.has(s.id));
          return [...prev, ...newSpots];
        });
      }
    }).catch(() => {});

    api.getUsers().then(serverUsers => {
      if (isMounted && serverUsers && serverUsers.length > 0) setUsers(serverUsers);
    }).catch(() => {});

    api.getRequests().then(serverReqs => {
      if (isMounted && serverReqs && serverReqs.length > 0) setRequests(serverReqs);
    }).catch(() => {});

    api.getThreads().then(serverThreads => {
      if (isMounted && serverThreads && serverThreads.length > 0) setThreads(serverThreads);
    }).catch(() => {});

    api.getPosts().then(serverPosts => {
      if (isMounted && serverPosts && serverPosts.length > 0) setCommunityPosts(serverPosts);
    }).catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const currentUser = users.find(u => u.id === currentUserId) || users[0];

  const switchUser = (userId: string) => {
    setCurrentUserId(userId);
  };

  const registerUser = (newUserData: Omit<User, 'id' | 'rating' | 'reviewCount' | 'tripsCompleted' | 'spotsHosted' | 'joinedYear'>): User => {
    const newUser: User = {
      ...newUserData,
      id: `user-${Date.now()}`,
      rating: 5.0,
      reviewCount: 0,
      tripsCompleted: 0,
      spotsHosted: 0,
      joinedYear: 2026,
    };
    setUsers(prev => [newUser, ...prev]);
    setCurrentUserId(newUser.id);
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

    return newReq;
  };

  const respondToStayRequest = (requestId: string, status: 'accepted' | 'declined', note?: string) => {
    setRequests(prev =>
      prev.map(r => {
        if (r.id === requestId) {
          return {
            ...r,
            status,
            hostResponseNote: note || (status === 'accepted' ? 'Your stay request has been warmly accepted! Looking forward to hosting you.' : 'Sorry, we are unavailable on those dates.'),
          };
        }
        return r;
      })
    );

    const req = requests.find(r => r.id === requestId);
    if (req) {
      const thread = threads.find(
        t => t.stayRequestId === requestId || (t.participants.includes(req.travelerId) && t.participants.includes(req.hostId))
      );
      if (thread) {
        const text = status === 'accepted'
          ? `🎉 Stay Request ACCEPTED! Host message: "${note || 'Looking forward to hosting you! Safe travels.'}"`
          : `Stay Request was declined: "${note || 'Dates unavailable.'}"`;
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
    }
  };

  const createSpot = (newSpotData: Omit<Spot, 'id' | 'createdAt' | 'rating' | 'reviewCount' | 'isFree'>): Spot => {
    const newSpot: Spot = {
      ...newSpotData,
      id: `spot-${Date.now()}`,
      isFree: true,
      rating: 5.0,
      reviewCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'active',
    };
    setSpots(prev => [newSpot, ...prev]);
    setUsers(prev =>
      prev.map(u => (u.id === newSpotData.hostId ? { ...u, spotsHosted: u.spotsHosted + 1 } : u))
    );
    api.createSpot(newSpot).catch(() => {});
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
      setSpots(prev =>
        prev.map(s => {
          if (s.id === reviewData.spotId) {
            const newCount = s.reviewCount + 1;
            const newRating = Number(((s.rating * s.reviewCount + reviewData.ratingOverall) / newCount).toFixed(2));
            return {
              ...s,
              rating: newRating,
              reviewCount: newCount,
            };
          }
          return s;
        })
      );
    }
  };

  const submitReport = (reportData: Omit<ReportItem, 'id' | 'createdAt' | 'status'>) => {
    const newReport: ReportItem = {
      ...reportData,
      id: `rep-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    setReports(prev => [newReport, ...prev]);
    api.createReport(newReport as any).catch(() => {});
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

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        spots,
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
        setCurrentView,
        setSelectedSpotId,
        setActiveThreadId,
        setSearchFilters,
        resetFilters,
        submitStayRequest,
        respondToStayRequest,
        sendMessage,
        createSpot,
        deleteSpot,
        updateSpotStatus,
        addSpotPhotos,
        submitReview,
        submitReport,
        blockUser,
        createCommunityPost,
        toggleCommunityUpvote,
        addCommunityComment,
        adminToggleSuspendUser,
        adminToggleFeatureSpot,
        adminResolveReport,
        adminToggleVerifyUser,
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
