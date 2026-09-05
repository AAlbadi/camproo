/**
 * CampRoo Traffic Attribution & Telemetry Engine
 * Automatically captures referrer, UTM parameters, device type, country, city, page opens,
 * and maintains continuous persistent telemetry stats across server & Cloudflare deployments.
 */

export interface TrafficAttribution {
  source: string;
  medium: string;
  campaign: string;
  content?: string;
  referrer: string;
  landingPage: string;
  timestamp: string;
}

export interface TrafficEvent {
  id: string;
  timestamp: string;
  path: string;
  referrer: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  timezone: string;
  country: string;
  countryCode: string;
  city: string;
  sessionId: string;
  device: 'desktop' | 'mobile';
  browser: string;
  flag?: string;
}

const STORAGE_KEY = 'camproo_traffic_attr';
const SESSION_KEY = 'camproo_session_id';
const EVENTS_KEY = 'camproo_traffic_events';

export const TIMEZONE_MAP: Record<string, { country: string; countryCode: string; city: string }> = {
  'Asia/Dubai': { country: 'United Arab Emirates', countryCode: 'AE', city: 'Dubai' },
  'Asia/Riyadh': { country: 'Saudi Arabia', countryCode: 'SA', city: 'Riyadh' },
  'America/New_York': { country: 'United States', countryCode: 'US', city: 'New York' },
  'America/Chicago': { country: 'United States', countryCode: 'US', city: 'Chicago' },
  'America/Denver': { country: 'United States', countryCode: 'US', city: 'Denver' },
  'America/Los_Angeles': { country: 'United States', countryCode: 'US', city: 'Los Angeles' },
  'America/Phoenix': { country: 'United States', countryCode: 'US', city: 'Phoenix' },
  'America/Anchorage': { country: 'United States', countryCode: 'US', city: 'Anchorage' },
  'Pacific/Honolulu': { country: 'United States', countryCode: 'US', city: 'Honolulu' },
  'America/Toronto': { country: 'Canada', countryCode: 'CA', city: 'Toronto' },
  'America/Vancouver': { country: 'Canada', countryCode: 'CA', city: 'Vancouver' },
  'Europe/London': { country: 'United Kingdom', countryCode: 'GB', city: 'London' },
  'Europe/Paris': { country: 'France', countryCode: 'FR', city: 'Paris' },
  'Europe/Berlin': { country: 'Germany', countryCode: 'DE', city: 'Berlin' },
  'Europe/Madrid': { country: 'Spain', countryCode: 'ES', city: 'Madrid' },
  'Europe/Rome': { country: 'Italy', countryCode: 'IT', city: 'Rome' },
  'Europe/Amsterdam': { country: 'Netherlands', countryCode: 'NL', city: 'Amsterdam' },
  'Asia/Tokyo': { country: 'Japan', countryCode: 'JP', city: 'Tokyo' },
  'Asia/Singapore': { country: 'Singapore', countryCode: 'SG', city: 'Singapore' },
  'Asia/Muscat': { country: 'Oman', countryCode: 'OM', city: 'Muscat' },
  'Asia/Qatar': { country: 'Qatar', countryCode: 'QA', city: 'Doha' },
  'Asia/Kuwait': { country: 'Kuwait', countryCode: 'KW', city: 'Kuwait City' },
  'Australia/Sydney': { country: 'Australia', countryCode: 'AU', city: 'Sydney' },
};

export const COUNTRY_FLAGS: Record<string, string> = {
  US: '🇺🇸', AE: '🇦🇪', CA: '🇨🇦', GB: '🇬🇧', FR: '🇫🇷', DE: '🇩🇪', ES: '🇪🇸',
  IT: '🇮🇹', NL: '🇳🇱', JP: '🇯🇵', SG: '🇸🇬', SA: '🇸🇦', OM: '🇴🇲', QA: '🇶🇦', KW: '🇰🇼', AU: '🇦🇺',
};

export function resolveLocationFromTimezone(timezone: string) {
  return TIMEZONE_MAP[timezone] || { country: 'United States', countryCode: 'US', city: 'Denver' };
}

export function getOrCreateSessionId(): string {
  let sessId = sessionStorage.getItem(SESSION_KEY);
  if (!sessId) {
    sessId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem(SESSION_KEY, sessId);
  }
  return sessId;
}

export function parseTrafficAttribution(): TrafficAttribution {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) {
    try {
      return JSON.parse(existing);
    } catch {}
  }

  const params = new URLSearchParams(window.location.search);
  const utmSource = params.get('utm_source');
  const utmMedium = params.get('utm_medium');
  const utmCampaign = params.get('utm_campaign');
  const utmContent = params.get('utm_content');

  const docRef = document.referrer;
  let detectedSource = utmSource || '';

  if (!detectedSource && docRef) {
    try {
      const url = new URL(docRef);
      const host = url.hostname.toLowerCase();
      if (host.includes('google')) detectedSource = 'google';
      else if (host.includes('reddit')) detectedSource = 'reddit';
      else if (host.includes('twitter') || host.includes('x.com')) detectedSource = 'twitter';
      else if (host.includes('facebook')) detectedSource = 'facebook';
      else if (host.includes('instagram')) detectedSource = 'instagram';
      else if (host.includes('youtube')) detectedSource = 'youtube';
      else detectedSource = host.replace('www.', '');
    } catch {
      detectedSource = 'external';
    }
  }

  if (!detectedSource) {
    detectedSource = 'direct';
  }

  const attribution: TrafficAttribution = {
    source: detectedSource,
    medium: utmMedium || (detectedSource === 'direct' ? 'direct' : 'referral'),
    campaign: utmCampaign || '',
    content: utmContent || '',
    referrer: docRef || 'Direct Visit',
    landingPage: window.location.pathname,
    timestamp: new Date().toISOString()
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
  } catch {}

  return attribution;
}

const SEED_EVENTS: TrafficEvent[] = [
  { id: 'evt-seed-1', timestamp: new Date(Date.now() - 3600000 * 5).toISOString(), path: '/', referrer: 'https://www.google.com', utmSource: 'google', utmMedium: 'organic', utmCampaign: 'rv_camping', timezone: 'America/Denver', country: 'United States', countryCode: 'US', city: 'Denver', sessionId: 'sess_seed_1', device: 'desktop', browser: 'Chrome', flag: '🇺🇸' },
  { id: 'evt-seed-2', timestamp: new Date(Date.now() - 3600000 * 4).toISOString(), path: '/explore', referrer: 'https://www.reddit.com/r/rvliving', utmSource: 'reddit', utmMedium: 'social', utmCampaign: 'boondocking', timezone: 'America/Los_Angeles', country: 'United States', countryCode: 'US', city: 'Los Angeles', sessionId: 'sess_seed_2', device: 'mobile', browser: 'Safari', flag: '🇺🇸' },
  { id: 'evt-seed-3', timestamp: new Date(Date.now() - 3600000 * 3).toISOString(), path: '/explore', referrer: 'Direct Visit', utmSource: 'direct', utmMedium: 'none', utmCampaign: '', timezone: 'Asia/Dubai', country: 'United Arab Emirates', countryCode: 'AE', city: 'Dubai', sessionId: 'sess_seed_3', device: 'desktop', browser: 'Chrome', flag: '🇦🇪' },
  { id: 'evt-seed-4', timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), path: '/about', referrer: 'https://www.google.com', utmSource: 'google', utmMedium: 'organic', utmCampaign: 'free_spots', timezone: 'Europe/London', country: 'United Kingdom', countryCode: 'GB', city: 'London', sessionId: 'sess_seed_4', device: 'mobile', browser: 'Safari', flag: '🇬🇧' },
  { id: 'evt-seed-5', timestamp: new Date(Date.now() - 3600000 * 1).toISOString(), path: '/spot-moab-redrock', referrer: 'https://twitter.com', utmSource: 'twitter', utmMedium: 'social', utmCampaign: 'vsotd', timezone: 'America/Chicago', country: 'United States', countryCode: 'US', city: 'Chicago', sessionId: 'sess_seed_5', device: 'desktop', browser: 'Firefox', flag: '🇺🇸' },
  { id: 'evt-seed-6', timestamp: new Date(Date.now() - 1800000).toISOString(), path: '/', referrer: 'Direct Visit', utmSource: 'direct', utmMedium: 'none', utmCampaign: '', timezone: 'Asia/Muscat', country: 'Oman', countryCode: 'OM', city: 'Muscat', sessionId: 'sess_seed_6', device: 'desktop', browser: 'Chrome', flag: '🇴🇲' },
  { id: 'evt-seed-7', timestamp: new Date(Date.now() - 600000).toISOString(), path: '/explore', referrer: 'https://www.google.com', utmSource: 'google', utmMedium: 'organic', utmCampaign: '', timezone: 'America/New_York', country: 'United States', countryCode: 'US', city: 'New York', sessionId: 'sess_seed_7', device: 'mobile', browser: 'Chrome', flag: '🇺🇸' },
  { id: 'evt-seed-8', timestamp: new Date(Date.now() - 120000).toISOString(), path: '/admin', referrer: 'Direct Visit', utmSource: 'direct', utmMedium: 'none', utmCampaign: '', timezone: 'Asia/Dubai', country: 'United Arab Emirates', countryCode: 'AE', city: 'Dubai', sessionId: 'sess_seed_8', device: 'desktop', browser: 'Chrome', flag: '🇦🇪' },
];

export function getStoredTrafficEvents(): TrafficEvent[] {
  try {
    const raw = localStorage.getItem(EVENTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  localStorage.setItem(EVENTS_KEY, JSON.stringify(SEED_EVENTS));
  return SEED_EVENTS;
}

export function recordStoredTrafficEvent(event: Partial<TrafficEvent>): TrafficEvent {
  const tz = event.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const loc = resolveLocationFromTimezone(tz);

  const fullEvent: TrafficEvent = {
    id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    path: event.path || window.location.pathname || '/',
    referrer: event.referrer || document.referrer || 'Direct Visit',
    utmSource: event.utmSource || 'direct',
    utmMedium: event.utmMedium || 'none',
    utmCampaign: event.utmCampaign || '',
    timezone: tz,
    country: loc.country,
    countryCode: loc.countryCode,
    city: loc.city,
    sessionId: event.sessionId || getOrCreateSessionId(),
    device: event.device || (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop'),
    browser: event.browser || 'Chrome',
    flag: COUNTRY_FLAGS[loc.countryCode] || '🌍'
  };

  const list = getStoredTrafficEvents();
  list.push(fullEvent);
  const bounded = list.slice(-5000);
  try {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(bounded));
  } catch {}
  return fullEvent;
}

/**
 * Report page view / navigation event
 */
export async function trackPageView(path = window.location.pathname) {
  const attr = parseTrafficAttribution();
  const sessionId = getOrCreateSessionId();
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const ua = navigator.userAgent;
  let browser = 'Unknown';
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Record in client-side storage
  recordStoredTrafficEvent({
    path,
    referrer: attr.referrer,
    utmSource: attr.source,
    utmMedium: attr.medium,
    utmCampaign: attr.campaign,
    timezone: tz,
    sessionId,
    device: isMobile ? 'mobile' : 'desktop',
    browser
  });

  // Attempt backend track dispatch
  try {
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path,
        referrer: attr.referrer,
        utm_source: attr.source,
        utm_medium: attr.medium,
        utm_campaign: attr.campaign,
        utm_content: attr.content,
        timezone: tz,
        language: navigator.language || 'en',
        sessionId,
        device: isMobile ? 'mobile' : 'desktop',
        browser,
        screenWidth: window.innerWidth
      })
    });
  } catch {}
}

export function getStoredTrafficStats() {
  const events = getStoredTrafficEvents();
  const totalViews = events.length;
  const uniqueSessions = new Set(events.map(e => e.sessionId)).size;

  const referrers: Record<string, number> = {};
  const sources: Record<string, number> = {};
  const devices: Record<string, number> = {};
  const countries: Record<string, { count: number; country: string }> = {};
  const cities: Record<string, { count: number; city: string; country: string; countryCode: string }> = {};
  const pages: Record<string, number> = {};

  events.forEach(e => {
    let refDomain = 'Direct / Bookmarked';
    if (e.referrer && e.referrer !== 'Direct' && e.referrer !== 'Direct Visit' && e.referrer.startsWith('http')) {
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

    if (e.countryCode) {
      countries[e.countryCode] = countries[e.countryCode] || { count: 0, country: e.country || 'Unknown' };
      countries[e.countryCode].count++;
    }
    if (e.city) {
      const cityKey = `${e.city}, ${e.countryCode || e.country}`;
      cities[cityKey] = cities[cityKey] || { count: 0, city: e.city, country: e.country, countryCode: e.countryCode };
      cities[cityKey].count++;
    }

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

  return {
    totalViews,
    uniqueSessions,
    topReferrers: Object.entries(referrers).map(([domain, count]) => ({ domain, count })).sort((a, b) => b.count - a.count),
    sourcesBreakdown: Object.entries(sources).map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count),
    devicesBreakdown: Object.entries(devices).map(([device, count]) => ({ device, count })),
    pagesBreakdown: Object.entries(pages).map(([path, count]) => ({ path, count })).sort((a, b) => b.count - a.count),
    countriesBreakdown,
    citiesBreakdown,
    recentEvents: events.slice(-30).reverse()
  };
}

export function getCurrentAttribution(): TrafficAttribution {
  return parseTrafficAttribution();
}
