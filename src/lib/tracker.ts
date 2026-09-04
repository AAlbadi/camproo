/**
 * CampRoo Traffic Attribution & Analytics Tracker
 * Automatically captures referrer, UTM parameters, device type,
 * and maintains first-touch marketing attribution for user signups.
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

const STORAGE_KEY = 'camproo_traffic_attr';
const SESSION_KEY = 'camproo_session_id';

export function getOrCreateSessionId(): string {
  let sessId = sessionStorage.getItem(SESSION_KEY);
  if (!sessId) {
    sessId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem(SESSION_KEY, sessId);
  }
  return sessId;
}

export function parseTrafficAttribution(): TrafficAttribution {
  // Check if first-touch attribution is already saved
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) {
    try {
      return JSON.parse(existing);
    } catch {
      // parse error, continue below
    }
  }

  // Parse URL search params
  const params = new URLSearchParams(window.location.search);
  const utmSource = params.get('utm_source');
  const utmMedium = params.get('utm_medium');
  const utmCampaign = params.get('utm_campaign');
  const utmContent = params.get('utm_content');

  // Determine referrer
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

  // Persist first-touch
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
  } catch (err) {
    // Storage quota or private mode fallback
  }

  return attribution;
}

/**
 * Report page view / navigation event to backend API
 */
export async function trackPageView(path = window.location.pathname) {
  try {
    const attr = parseTrafficAttribution();
    const sessionId = getOrCreateSessionId();
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

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
        sessionId,
        device: isMobile ? 'mobile' : 'desktop',
        screenWidth: window.innerWidth
      })
    });
  } catch (err) {
    // Silently fail if offline or proxy not connected
  }
}

/**
 * Get current marketing attribution to attach to signup or newsletter
 */
export function getCurrentAttribution(): TrafficAttribution {
  return parseTrafficAttribution();
}
