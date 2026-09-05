import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'camproo_db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const COUNTRY_FLAGS = {
  US: '🇺🇸', AE: '🇦🇪', CA: '🇨🇦', GB: '🇬🇧', FR: '🇫🇷', DE: '🇩🇪', ES: '🇪🇸',
  IT: '🇮🇹', NL: '🇳🇱', RU: '🇷🇺', JP: '🇯🇵', CN: '🇨🇳', IN: '🇮🇳', KR: '🇰🇷',
  AU: '🇦🇺', MX: '🇲🇽', BR: '🇧🇷', EG: '🇪🇬', ZA: '🇿🇦', SG: '🇸🇬', TH: '🇹🇭',
  ID: '🇮🇩', PH: '🇵🇭', PK: '🇵🇰', BD: '🇧🇩', AR: '🇦🇷', CO: '🇨🇴', PE: '🇵🇪',
  TR: '🇹🇷', PL: '🇵🇱', CH: '🇨🇭', SE: '🇸🇪', NO: '🇳🇴', DK: '🇩🇰', FI: '🇫🇮',
  SA: '🇸🇦', OM: '🇴🇲', QA: '🇶🇦', BH: '🇧🇭', KW: '🇰🇼', LB: '🇱🇧', IL: '🇮🇱',
  JO: '🇯🇴', IQ: '🇮🇶',
};

const initialSchema = {
  users: [
    {
      id: 'user-traveler-1',
      name: 'Alex & Sam Rover',
      email: 'alex.sam@camproo.com',
      role: 'traveler',
      phone: '+1 (555) 432-8765',
      avatar: 'https://ui-avatars.com/api/?name=Alex+Rover&background=0284c7&color=fff&bold=true',
      bio: 'Full-time rovers in a 28ft Class C with two Australian Shepherds.',
      homeRegion: 'Pacific Northwest',
      yearsRVing: 5,
      joinedYear: 2021,
      rating: 4.96,
      reviewCount: 28,
      newsletterOptIn: true,
      trafficAttribution: { source: 'direct', medium: 'none', campaign: '', referrer: 'Direct Visit' },
      rig: { type: 'class_c', makeModel: 'Thor Chateau 28Z', lengthFt: 28, year: 2021 },
      verifications: { email: true, phone: true, idDocument: true, rvOwnership: true },
      createdAt: new Date('2021-04-10T12:00:00Z').toISOString()
    },
    {
      id: 'user-host-1',
      name: 'Caleb & Sarah Jenkins',
      email: 'caleb.sarah@redrockmoab.com',
      role: 'host',
      phone: '+1 (555) 987-6543',
      avatar: 'https://ui-avatars.com/api/?name=Caleb+Jenkins&background=ea580c&color=fff&bold=true',
      bio: 'Lifelong Moab locals hosting sustainable boondockers on 40 private desert acres.',
      homeRegion: 'Moab, UT',
      yearsRVing: 12,
      joinedYear: 2019,
      rating: 4.98,
      reviewCount: 64,
      newsletterOptIn: true,
      trafficAttribution: { source: 'google', medium: 'organic', campaign: 'free_rv_spots', referrer: 'https://www.google.com' },
      rig: { type: 'campervan', makeModel: 'Mercedes Sprinter 4x4', lengthFt: 22, year: 2023 },
      verifications: { email: true, phone: true, idDocument: true, rvOwnership: true },
      createdAt: new Date('2019-08-15T10:30:00Z').toISOString()
    }
  ],
  spots: [
    {
      id: 'spot-moab-redrock',
      hostId: 'user-host-1',
      title: 'Red Rock Roo Oasis & BLM Gateway',
      tagline: 'Level pull-through gravel pad 10 mins from Arches with 30A power & dark night skies',
      description: 'Welcome to our private red rock acreage nestled right along Spanish Valley, just 10 minutes south of Arches and Canyonlands.',
      locationName: 'Moab',
      generalArea: 'Utah, USA',
      coordinates: [38.5733, -109.5498],
      photos: ['https://thumb.wikimedia.org/wikipedia/commons/thumb/6/67/-TravelTuesday_with_My_Public_Lands_%2824446462030%29.jpg/1280px--TravelTuesday_with_My_Public_Lands_%2824446462030%29.jpg'],
      spaceType: 'desert_oasis',
      environment: 'desert',
      rigCompatibility: { maxLengthFt: 38, maxHeightFt: 13.5, maxWidthFt: 8.5, acceptedTypes: ['class_a', 'class_b', 'class_c'], accessType: 'pull_through', surfaceType: 'packed_gravel', isLevel: true, turnaroundSpace: 'Full driveway pad.', trailerDisconnectRequired: false },
      amenities: { electricity: '30amp', water: 'potable_hookup', sewer: 'none', wifi: true, bathroom: false, shower: false, firePit: true, trash: true, shade: 'partial', generatorsAllowed: true, petsAllowed: true, familyFriendly: true, quietSetting: true, offGridCapable: false },
      proximity: { fuelNearbyMiles: 4, groceriesNearbyMiles: 5, rvDumpNearbyMiles: 6, attractionNote: 'Arches National Park 10 mins' },
      rules: { maxStayNights: 4, checkInWindow: '2:00 PM - 8:00 PM', checkOutTime: '11:00 AM', quietHours: '10:00 PM - 7:00 AM', campfirePolicy: 'Fire pit permitted in designated ring', childrenAllowed: true, extraGuestsAllowed: true, hostInteraction: 'social_loves_to_chat' },
      gatekeeping: 'any_member',
      rating: 4.98,
      reviewCount: 42,
      isFree: true,
      isFeatured: true,
      status: 'active',
      createdAt: '2024-01-15'
    }
  ],
  requests: [],
  threads: [],
  posts: [],
  reviews: [],
  reports: [],
  spot_edits: [],
  traffic_events: [],
  newsletter_subscribers: [],
  email_logs: [],
  vsotd: {
    spotId: 'spot-moab-redrock',
    title: 'Red Rock Roo Oasis & BLM Gateway',
    locationName: 'Moab, Utah',
    highlightNote: 'Ranger Pick of the Day: Level 30A pull-through pad minutes from Arches National Park.',
    selectedAt: new Date().toISOString(),
    clicks: 142,
    impressions: 1250,
    history: []
  }
};

class Database {
  constructor() {
    this.data = initialSchema;
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        this.data = {
          ...initialSchema,
          ...parsed,
          users: parsed.users || initialSchema.users,
          spots: parsed.spots || initialSchema.spots,
          requests: parsed.requests || initialSchema.requests,
          threads: parsed.threads || initialSchema.threads,
          posts: parsed.posts || initialSchema.posts,
          reviews: parsed.reviews || initialSchema.reviews,
          reports: parsed.reports || initialSchema.reports,
          spot_edits: parsed.spot_edits || [],
          traffic_events: parsed.traffic_events || [],
          newsletter_subscribers: parsed.newsletter_subscribers || [],
          email_logs: parsed.email_logs || [],
          vsotd: parsed.vsotd || initialSchema.vsotd
        };
      } else {
        this.save();
      }
    } catch (err) {
      console.error('[CampRoo DB] Failed to load database file, using fallback:', err);
      this.data = initialSchema;
    }
  }

  save() {
    try {
      const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempFile, JSON.stringify(this.data, null, 2), 'utf8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.error('[CampRoo DB] Save error:', err);
    }
  }

  // Users
  getUsers() {
    return this.data.users;
  }
  getUserById(id) {
    return this.data.users.find(u => u.id === id) || null;
  }
  addUser(userData) {
    const newUser = {
      id: userData.id || `user-${Date.now()}`,
      joinedYear: userData.joinedYear || new Date().getFullYear(),
      rating: userData.rating || 5.0,
      reviewCount: userData.reviewCount || 0,
      verifications: userData.verifications || { email: true, phone: false, idDocument: false, rvOwnership: false },
      createdAt: new Date().toISOString(),
      ...userData,
    };
    this.data.users.push(newUser);
    this.save();
    return newUser;
  }
  updateUser(id, updates) {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      this.data.users[idx] = { ...this.data.users[idx], ...updates };
      this.save();
      return this.data.users[idx];
    }
    return null;
  }
  deleteUser(id) {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      this.data.users.splice(idx, 1);
      this.save();
      return true;
    }
    return false;
  }

  // Saved Spots
  getSavedSpots(userId) {
    const user = this.getUserById(userId);
    return (user && user.savedSpotIds) ? user.savedSpotIds : [];
  }
  saveSpot(userId, spotId) {
    let user = this.getUserById(userId);
    if (!user) {
      user = this.addUser({ id: userId, name: 'Roamer', savedSpotIds: [spotId] });
    } else {
      if (!user.savedSpotIds) user.savedSpotIds = [];
      if (!user.savedSpotIds.includes(spotId)) {
        user.savedSpotIds.push(spotId);
        this.save();
      }
    }
    return user.savedSpotIds;
  }
  unsaveSpot(userId, spotId) {
    const user = this.getUserById(userId);
    if (!user || !user.savedSpotIds) return [];
    user.savedSpotIds = user.savedSpotIds.filter(id => id !== spotId);
    this.save();
    return user.savedSpotIds;
  }

  // Spots
  getSpots(filters = {}) {
    let result = [...this.data.spots];
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(s =>
        (s.title || '').toLowerCase().includes(q) ||
        (s.locationName || '').toLowerCase().includes(q) ||
        (s.generalArea || '').toLowerCase().includes(q) ||
        (s.description || '').toLowerCase().includes(q)
      );
    }
    if (filters.environment && filters.environment !== "all") {
      result = result.filter(s => s.environment === filters.environment);
    }
    if (filters.minLength) {
      const minL = Number(filters.minLength);
      result = result.filter(s => (s.rigCompatibility?.maxLengthFt || 0) >= minL);
    }
    return result;
  }
  getSpotById(id) {
    return this.data.spots.find(s => s.id === id) || null;
  }
  addSpot(spotData) {
    const newSpot = {
      id: spotData.id || `spot-${Date.now()}`,
      rating: spotData.rating || 5.0,
      reviewCount: spotData.reviewCount || 0,
      photos: spotData.photos && spotData.photos.length > 0 ? spotData.photos : ["/images/real_bald_mountain.jpg"],
      status: spotData.status || "active",
      createdAt: spotData.createdAt || new Date().toISOString().split("T")[0],
      ...spotData,
    };
    this.data.spots.unshift(newSpot);
    this.save();
    return newSpot;
  }
  updateSpot(id, updates) {
    const idx = this.data.spots.findIndex(s => s.id === id);
    if (idx === -1) return null;
    this.data.spots[idx] = { ...this.data.spots[idx], ...updates };
    this.save();
    return this.data.spots[idx];
  }
  deleteSpot(id) {
    const idx = this.data.spots.findIndex(s => s.id === id);
    if (idx === -1) return false;
    this.data.spots.splice(idx, 1);
    this.save();
    return true;
  }

  // Stay Requests
  getRequests(query = {}) {
    let list = [...this.data.requests];
    if (query.travelerId) list = list.filter(r => r.travelerId === query.travelerId);
    if (query.hostId) list = list.filter(r => r.hostId === query.hostId);
    return list;
  }
  getRequestById(id) {
    return this.data.requests.find(r => r.id === id) || null;
  }
  addRequest(reqData) {
    const newReq = {
      id: reqData.id || `req-${Date.now()}`,
      status: "pending",
      createdAt: new Date().toISOString(),
      ...reqData,
    };
    this.data.requests.unshift(newReq);
    this.save();
    return newReq;
  }
  updateRequest(id, updates) {
    const idx = this.data.requests.findIndex(r => r.id === id);
    if (idx === -1) return null;
    this.data.requests[idx] = { ...this.data.requests[idx], ...updates };
    this.save();
    return this.data.requests[idx];
  }

  // Threads & Messages
  getThreads(userId) {
    if (!userId) return this.data.threads || [];
    return (this.data.threads || []).filter(t => 
      (Array.isArray(t.participantIds) && t.participantIds.includes(userId)) ||
      (Array.isArray(t.participants) && t.participants.includes(userId))
    );
  }
  getThreadById(id) {
    return this.data.threads.find(t => t.id === id) || null;
  }
  addThread(threadData) {
    const newThread = {
      id: threadData.id || `thread-${Date.now()}`,
      messages: threadData.messages || [],
      lastMessageAt: new Date().toISOString(),
      unreadBy: threadData.unreadBy || [],
      ...threadData,
    };
    this.data.threads.unshift(newThread);
    this.save();
    return newThread;
  }
  addMessageToThread(threadId, msgData) {
    const thread = this.data.threads.find(t => t.id === threadId);
    if (!thread) return null;
    const newMsg = {
      id: msgData.id || `msg-${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...msgData,
    };
    thread.messages.push(newMsg);
    thread.lastMessageAt = newMsg.createdAt;
    const participants = thread.participantIds || thread.participants || [];
    thread.unreadBy = participants.filter(p => p !== msgData.senderId);
    this.save();
    return newMsg;
  }
  markThreadRead(threadId, userId) {
    const thread = this.data.threads.find(t => t.id === threadId);
    if (!thread) return false;
    thread.unreadBy = (thread.unreadBy || []).filter(u => u !== userId);
    this.save();
    return true;
  }

  // Posts
  getPosts(category) {
    if (!category || category === "all") return this.data.posts;
    return this.data.posts.filter(p => p.category === category);
  }
  addPost(postData) {
    const newPost = {
      id: postData.id || `post-${Date.now()}`,
      upvotes: 0,
      upvotedBy: [],
      comments: [],
      createdAt: new Date().toISOString(),
      ...postData,
    };
    this.data.posts.unshift(newPost);
    this.save();
    return newPost;
  }
  upvotePost(id, userId) {
    const post = this.data.posts.find(p => p.id === id);
    if (!post) return null;
    if (!post.upvotedBy) post.upvotedBy = [];
    const idx = post.upvotedBy.indexOf(userId);
    if (idx !== -1) {
      post.upvotedBy.splice(idx, 1);
      post.upvotes = Math.max(0, post.upvotes - 1);
    } else {
      post.upvotedBy.push(userId);
      post.upvotes += 1;
    }
    this.save();
    return post;
  }
  addCommentToPost(postId, commentData) {
    const post = this.data.posts.find(p => p.id === postId);
    if (!post) return null;
    const newComment = {
      id: commentData.id || `comment-${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...commentData,
    };
    if (!post.comments) post.comments = [];
    post.comments.push(newComment);
    this.save();
    return newComment;
  }

  // Reviews
  getReviews(spotId) {
    if (!spotId) return this.data.reviews;
    return this.data.reviews.filter(r => r.spotId === spotId);
  }
  addReview(reviewData) {
    const newReview = {
      id: reviewData.id || `rev-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: reviewData.status || 'pending',
      ...reviewData,
    };
    this.data.reviews.unshift(newReview);
    const spot = this.data.spots.find(s => s.id === reviewData.spotId);
    if (spot) {
      const spotRevs = this.data.reviews.filter(r => r.spotId === spot.id);
      const avg = spotRevs.reduce((acc, r) => acc + (r.ratingOverall || r.rating || 5), 0) / spotRevs.length;
      spot.rating = parseFloat(avg.toFixed(2));
      spot.reviewCount = spotRevs.length;
    }
    this.save();
    return newReview;
  }

  updateReview(reviewId, updates) {
    const idx = this.data.reviews.findIndex(r => r.id === reviewId);
    if (idx === -1) return null;
    this.data.reviews[idx] = {
      ...this.data.reviews[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    const spotId = this.data.reviews[idx].spotId;
    if (spotId) {
      const spot = this.data.spots.find(s => s.id === spotId);
      if (spot) {
        const spotRevs = this.data.reviews.filter(r => r.spotId === spot.id);
        const avg = spotRevs.reduce((acc, r) => acc + (r.ratingOverall || r.rating || 5), 0) / spotRevs.length;
        spot.rating = parseFloat(avg.toFixed(2));
        spot.reviewCount = spotRevs.length;
      }
    }
    this.save();
    return this.data.reviews[idx];
  }

  deleteReview(reviewId) {
    const idx = this.data.reviews.findIndex(r => r.id === reviewId);
    if (idx === -1) return false;
    const [deleted] = this.data.reviews.splice(idx, 1);
    if (deleted?.spotId) {
      const spot = this.data.spots.find(s => s.id === deleted.spotId);
      if (spot) {
        const spotRevs = this.data.reviews.filter(r => r.spotId === spot.id);
        spot.reviewCount = spotRevs.length;
        if (spotRevs.length > 0) {
          const avg = spotRevs.reduce((acc, r) => acc + (r.ratingOverall || r.rating || 5), 0) / spotRevs.length;
          spot.rating = parseFloat(avg.toFixed(2));
        } else {
          spot.rating = 5.0;
        }
      }
    }
    this.save();
    return true;
  }

  approveReview(reviewId) {
    return this.updateReview(reviewId, { status: 'approved', isModerated: true });
  }

  // Spot Edit Requests
  getSpotEditRequests() {
    return this.data.spot_edits || [];
  }

  addSpotEditRequest(editData) {
    const newRequest = {
      id: editData.id || `edit-req-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'pending',
      ...editData,
    };
    if (!this.data.spot_edits) this.data.spot_edits = [];
    this.data.spot_edits.unshift(newRequest);
    this.save();
    return newRequest;
  }

  updateSpotEditRequest(requestId, updates) {
    if (!this.data.spot_edits) this.data.spot_edits = [];
    const idx = this.data.spot_edits.findIndex(e => e.id === requestId);
    if (idx === -1) return null;
    this.data.spot_edits[idx] = {
      ...this.data.spot_edits[idx],
      ...updates
    };
    this.save();
    return this.data.spot_edits[idx];
  }

  // Reports
  getReports() {
    return this.data.reports;
  }
  addReport(reportData) {
    const newReport = {
      id: reportData.id || `report-${Date.now()}`,
      status: "pending",
      createdAt: new Date().toISOString(),
      ...reportData,
    };
    this.data.reports.unshift(newReport);
    this.save();
    return newReport;
  }
  updateReport(id, updates) {
    const idx = this.data.reports.findIndex(r => r.id === id);
    if (idx === -1) return null;
    this.data.reports[idx] = { ...this.data.reports[idx], ...updates };
    this.save();
    return this.data.reports[idx];
  }

  // VSOTD (Vehicle & Spot Of The Day)
  getVsotd() {
    return this.data.vsotd || initialSchema.vsotd;
  }
  registerVsotd(vsotdData) {
    const current = this.data.vsotd || initialSchema.vsotd;
    const historyEntry = {
      spotId: current.spotId,
      title: current.title,
      locationName: current.locationName,
      selectedAt: current.selectedAt,
      clicks: current.clicks || 0,
      impressions: current.impressions || 0
    };
    
    this.data.vsotd = {
      spotId: vsotdData.spotId || current.spotId,
      title: vsotdData.title || current.title,
      locationName: vsotdData.locationName || current.locationName,
      highlightNote: vsotdData.highlightNote || 'Featured Ranger Choice VSOTD.',
      selectedAt: new Date().toISOString(),
      clicks: 0,
      impressions: 0,
      history: [historyEntry, ...(current.history || [])].slice(0, 30)
    };
    this.save();
    return this.data.vsotd;
  }
  trackVsotdClick() {
    if (!this.data.vsotd) this.data.vsotd = initialSchema.vsotd;
    this.data.vsotd.clicks = (this.data.vsotd.clicks || 0) + 1;
    this.save();
    return this.data.vsotd;
  }

  // Traffic / Analytics
  recordTrafficEvent(eventData) {
    const event = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...eventData
    };
    this.data.traffic_events.push(event);
    if (this.data.traffic_events.length > 10000) {
      this.data.traffic_events = this.data.traffic_events.slice(-10000);
    }
    this.save();
    return event;
  }

  getTrafficStats() {
    const events = this.data.traffic_events;
    const totalViews = events.length;
    const uniqueSessions = new Set(events.map(e => e.sessionId || e.ip)).size;

    const referrers = {};
    const sources = {};
    const devices = {};
    const countries = {};
    const cities = {};
    const timezones = {};

    events.forEach(e => {
      let refDomain = 'Direct / Bookmarked';
      if (e.referrer && e.referrer !== 'Direct' && e.referrer.startsWith('http')) {
        try {
          refDomain = new URL(e.referrer).hostname.replace('www.', '');
        } catch {
          refDomain = e.referrer;
        }
      }
      referrers[refDomain] = (referrers[refDomain] || 0) + 1;

      const src = e.utmSource || (refDomain.includes('google') ? 'google' : refDomain.includes('reddit') ? 'reddit' : 'direct');
      sources[src] = (sources[src] || 0) + 1;

      const dev = e.device || 'desktop';
      devices[dev] = (devices[dev] || 0) + 1;

      if (e.countryCode && e.countryCode !== 'UN') {
        countries[e.countryCode] = countries[e.countryCode] || { count: 0, country: e.country || 'Unknown' };
        countries[e.countryCode].count++;
      }
      if (e.city && e.city !== 'Unknown' && e.country) {
        const cityKey = `${e.city}, ${e.countryCode || e.country}`;
        cities[cityKey] = cities[cityKey] || { count: 0, city: e.city, country: e.country, countryCode: e.countryCode };
        cities[cityKey].count++;
      }
      if (e.timezone) {
        timezones[e.timezone] = (timezones[e.timezone] || 0) + 1;
      }
    });

    const signupsBySource = {};
    this.data.users.forEach(u => {
      const s = u.trafficAttribution?.source || 'direct';
      signupsBySource[s] = (signupsBySource[s] || 0) + 1;
    });

    const pages = {};
    events.forEach(e => {
      const p = e.path || '/';
      pages[p] = (pages[p] || 0) + 1;
    });

    const countriesBreakdown = Object.entries(countries).map(([code, data]) => ({
      countryCode: code,
      country: data.country,
      flag: COUNTRY_FLAGS[code] || '🌍',
      count: data.count,
      percentage: totalViews > 0 ? Math.round((data.count / totalViews) * 100) : 0
    })).sort((a, b) => b.count - a.count);

    const citiesBreakdown = Object.values(cities)
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    const timezonesBreakdown = Object.entries(timezones)
      .map(([timezone, count]) => ({ timezone, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalViews,
      uniqueSessions,
      totalUsers: this.data.users.length,
      totalSpots: this.data.spots.length,
      totalSubscribers: this.data.newsletter_subscribers.length,
      vsotd: this.data.vsotd,
      topReferrers: Object.entries(referrers).map(([domain, count]) => ({ domain, count })).sort((a, b) => b.count - a.count),
      sourcesBreakdown: Object.entries(sources).map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count),
      devicesBreakdown: Object.entries(devices).map(([device, count]) => ({ device, count })),
      pagesBreakdown: Object.entries(pages).map(([path, count]) => ({ path, count })).sort((a, b) => b.count - a.count),
      countriesBreakdown,
      citiesBreakdown,
      timezonesBreakdown,
      signupsBySource,
      recentEvents: events.slice(-30).reverse().map(e => ({
        ...e,
        flag: e.countryCode ? (COUNTRY_FLAGS[e.countryCode] || '🌍') : undefined
      }))
    };
  }

  // Newsletter
  addSubscriber({ email, name = '', source = 'footer', trafficSource = 'direct' }) {
    const existing = this.data.newsletter_subscribers.find(s => s.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      if (existing.status === 'unsubscribed') {
        existing.status = 'active';
        existing.resubscribedAt = new Date().toISOString();
        this.save();
      }
      return { subscriber: existing, isNew: false };
    }
    const sub = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      email: email.toLowerCase().trim(),
      name,
      status: 'active',
      source,
      trafficSource,
      subscribedAt: new Date().toISOString()
    };
    this.data.newsletter_subscribers.push(sub);
    this.save();
    return { subscriber: sub, isNew: true };
  }

  getSubscribers() {
    return this.data.newsletter_subscribers;
  }

  // Email Logs
  logEmail({ to, subject, type, status, provider, details = '' }) {
    const log = {
      id: `email-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      to,
      subject,
      type,
      status,
      provider,
      details,
      sentAt: new Date().toISOString()
    };
    this.data.email_logs.push(log);
    this.save();
    return log;
  }

  getEmailLogs() {
    return this.data.email_logs.slice(-50).reverse();
  }
}

export const db = new Database();
