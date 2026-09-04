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

// Initial database schema seed
const initialSchema = {
  users: [
    {
      id: 'user-traveler-1',
      name: 'Alex & Sam Rover',
      email: 'alex.sam@camproo.com',
      role: 'traveler',
      phone: '+1 (555) 432-8765',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
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
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
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
    });

    // Conversions by source (users who registered)
    const signupsBySource = {};
    this.data.users.forEach(u => {
      const s = u.trafficAttribution?.source || 'direct';
      signupsBySource[s] = (signupsBySource[s] || 0) + 1;
    });

    return {
      totalViews,
      uniqueSessions,
      totalUsers: this.data.users.length,
      totalSubscribers: this.data.newsletter_subscribers.length,
      topReferrers: Object.entries(referrers).map(([domain, count]) => ({ domain, count })).sort((a, b) => b.count - a.count),
      sourcesBreakdown: Object.entries(sources).map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count),
      devicesBreakdown: Object.entries(devices).map(([device, count]) => ({ device, count })),
      signupsBySource,
      recentEvents: events.slice(-25).reverse()
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
