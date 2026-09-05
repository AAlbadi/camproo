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

// Initial database schema seed
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
      trafficAttribution: {
        source: 'direct',
        medium: 'none',
        campaign: '',
        referrer: 'Direct Visit'
      },
      rig: {
        type: 'class_c',
        makeModel: 'Thor Chateau 28Z',
        lengthFt: 28,
        year: 2021
      },
      verifications: {
        email: true,
        phone: true,
        idDocument: true,
        rvOwnership: true
      },
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
      trafficAttribution: {
        source: 'google',
        medium: 'organic',
        campaign: 'free_rv_spots',
        referrer: 'https://www.google.com'
      },
      rig: {
        type: 'campervan',
        makeModel: 'Mercedes Sprinter 4x4',
        lengthFt: 22,
        year: 2023
      },
      verifications: {
        email: true,
        phone: true,
        idDocument: true,
        rvOwnership: true
      },
      createdAt: new Date('2019-08-15T10:30:00Z').toISOString()
    }
  ],
  traffic_events: [
    {
      id: 'evt-sample-1',
      sessionId: 'sess-init-1',
      path: '/',
      referrer: 'https://www.google.com',
      utmSource: 'google',
      utmMedium: 'organic',
      utmCampaign: 'free_rv_camping',
      device: 'desktop',
      browser: 'Chrome',
      ip: '127.0.0.1',
      country: 'United States',
      city: 'Austin',
      timestamp: new Date(Date.now() - 3600000 * 4).toISOString()
    },
    {
      id: 'evt-sample-2',
      sessionId: 'sess-init-2',
      path: '/explore',
      referrer: 'https://www.reddit.com/r/vandwellers',
      utmSource: 'reddit',
      utmMedium: 'social',
      utmCampaign: 'community_spots',
      device: 'mobile',
      browser: 'Safari',
      ip: '127.0.0.1',
      country: 'United States',
      city: 'Denver',
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
    }
  ],
  newsletter_subscribers: [
    {
      id: 'sub-1',
      email: 'alex.sam@camproo.com',
      name: 'Alex & Sam Rover',
      status: 'active',
      source: 'signup_checkbox',
      trafficSource: 'direct',
      subscribedAt: new Date('2021-04-10T12:00:00Z').toISOString()
    },
    {
      id: 'sub-2',
      email: 'caleb.sarah@redrockmoab.com',
      name: 'Caleb & Sarah Jenkins',
      status: 'active',
      source: 'signup_checkbox',
      trafficSource: 'google',
      subscribedAt: new Date('2019-08-15T10:30:00Z').toISOString()
    }
  ],
  email_logs: [
    {
      id: 'email-1',
      to: 'alex.sam@camproo.com',
      subject: 'Welcome to CampRoo! 🚐',
      type: 'welcome',
      status: 'delivered',
      provider: 'mock_sandbox',
      sentAt: new Date('2021-04-10T12:00:05Z').toISOString()
    }
  ]
};

// Database class
class Database {
  constructor() {
    this.data = initialSchema;
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } else {
        this.save();
      }
    } catch (err) {
      console.error('[DB] Error loading database file, initializing defaults:', err);
      this.data = initialSchema;
      this.save();
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DB] Error persisting database file:', err);
    }
  }

  // Users
  findUserByEmail(email) {
    if (!email) return null;
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  findUserById(id) {
    return this.data.users.find(u => u.id === id);
  }

  createUser(userData) {
    const newUser = {
      id: userData.id || `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      joinedYear: new Date().getFullYear(),
      rating: 5.0,
      reviewCount: 0,
      tripsCompleted: 0,
      spotsHosted: 0,
      ...userData
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

  getAllUsers() {
    return this.data.users;
  }

  // Traffic / Analytics
  recordTrafficEvent(eventData) {
    const event = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...eventData
    };
    this.data.traffic_events.push(event);

    // Keep events array bounded to last 10,000 for disk efficiency
    if (this.data.traffic_events.length > 10000) {
      this.data.traffic_events = this.data.traffic_events.slice(-10000);
    }

    this.save();
    return event;
  }

  getTrafficStats() {
    const events = this.data.traffic_events;
    const totalViews = events.length;

    // Unique sessions
    const uniqueSessions = new Set(events.map(e => e.sessionId || e.ip)).size;

    // Referrers breakdown
    const referrers = {};
    const sources = {};
    const devices = {};
    const countries = {};
    const cities = {};
    const timezones = {};

    events.forEach(e => {
      // Clean referrer
      let refDomain = 'Direct / Bookmarked';
      if (e.referrer && e.referrer !== 'Direct' && e.referrer.startsWith('http')) {
        try {
          refDomain = new URL(e.referrer).hostname.replace('www.', '');
        } catch {
          refDomain = e.referrer;
        }
      }
      referrers[refDomain] = (referrers[refDomain] || 0) + 1;

      // UTM source
      const src = e.utmSource || (refDomain.includes('google') ? 'google' : refDomain.includes('reddit') ? 'reddit' : 'direct');
      sources[src] = (sources[src] || 0) + 1;

      // Device
      const dev = e.device || 'desktop';
      devices[dev] = (devices[dev] || 0) + 1;

      // Geo & Timezone
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

    // Conversions by source (users who registered)
    const signupsBySource = {};
    this.data.users.forEach(u => {
      const s = u.trafficAttribution?.source || 'direct';
      signupsBySource[s] = (signupsBySource[s] || 0) + 1;
    });

    // Top Pages
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
      totalSubscribers: this.data.newsletter_subscribers.length,
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
