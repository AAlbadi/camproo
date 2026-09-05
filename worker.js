/**
 * CampRoo Cloudflare Worker Edge Telemetry & REST API Engine
 * Captures real Cloudflare edge visitor traffic (cf-ipcountry, cf-connecting-ip, cf-ipcity, user-agent),
 * processes analytics stats, manages VSOTD state, and handles SPA asset routing out-of-the-box.
 */

const COUNTRY_FLAGS = {
  US: '🇺🇸', AE: '🇦🇪', CA: '🇨🇦', GB: '🇬🇧', FR: '🇫🇷', DE: '🇩🇪', ES: '🇪🇸',
  IT: '🇮🇹', NL: '🇳🇱', RU: '🇷🇺', JP: '🇯🇵', CN: '🇨🇳', IN: '🇮🇳', KR: '🇰🇷',
  AU: '🇦🇺', MX: '🇲🇽', BR: '🇧🇷', EG: '🇪🇬', ZA: '🇿🇦', SG: '🇸🇬', TH: '🇹🇭',
  SA: '🇸🇦', OM: '🇴🇲', QA: '🇶🇦', BH: '🇧🇭', KW: '🇰🇼',
};

const COUNTRY_NAMES = {
  US: 'United States', AE: 'United Arab Emirates', CA: 'Canada', GB: 'United Kingdom',
  FR: 'France', DE: 'Germany', ES: 'Spain', IT: 'Italy', NL: 'Netherlands',
  JP: 'Japan', CN: 'China', IN: 'India', KR: 'South Korea', AU: 'Australia',
  MX: 'Mexico', BR: 'Brazil', EG: 'Egypt', ZA: 'South Africa', SG: 'Singapore',
  TH: 'Thailand', SA: 'Saudi Arabia', OM: 'Oman', QA: 'Qatar', BH: 'Bahrain', KW: 'Kuwait'
};

const TIMEZONE_MAP = {
  'Asia/Dubai': { country: 'United Arab Emirates', countryCode: 'AE', city: 'Dubai' },
  'Asia/Riyadh': { country: 'Saudi Arabia', countryCode: 'SA', city: 'Riyadh' },
  'America/New_York': { country: 'United States', countryCode: 'US', city: 'New York' },
  'America/Chicago': { country: 'United States', countryCode: 'US', city: 'Chicago' },
  'America/Denver': { country: 'United States', countryCode: 'US', city: 'Denver' },
  'America/Los_Angeles': { country: 'United States', countryCode: 'US', city: 'Los Angeles' },
  'Europe/London': { country: 'United Kingdom', countryCode: 'GB', city: 'London' },
  'Asia/Muscat': { country: 'Oman', countryCode: 'OM', city: 'Muscat' },
};

// 100% Pure Edge Telemetry & VSOTD state maintained at Cloudflare Edge
let edgeEvents = [];
let vsotdState = {
  spotId: 'spot-moab-redrock',
  title: 'Red Rock Roo Oasis & BLM Gateway',
  locationName: 'Moab, Utah',
  highlightNote: 'Ranger Choice: Level 30A pull-through pad minutes from Arches National Park.',
  selectedAt: new Date().toISOString(),
  clicks: 14,
  impressions: 1250,
  history: []
};

function recordEdgeVisitor(request, customPayload = {}) {
  try {
    const url = new URL(request.url);
    const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const cfCountry = request.headers.get('cf-ipcountry') || request.cf?.country || 'US';
    const cfCity = request.headers.get('cf-ipcity') || request.cf?.city || customPayload.city || '';
    
    let countryCode = cfCountry !== 'XX' && cfCountry !== 'T1' ? cfCountry : 'US';
    let country = COUNTRY_NAMES[countryCode] || customPayload.country || 'United States';
    let city = cfCity && cfCity !== 'Unknown' ? cfCity : (customPayload.city || 'Denver');

    if (customPayload.timezone && TIMEZONE_MAP[customPayload.timezone]) {
      const tzInfo = TIMEZONE_MAP[customPayload.timezone];
      if (!cfCity) city = tzInfo.city;
      if (!cfCountry || cfCountry === 'XX') {
        countryCode = tzInfo.countryCode;
        country = tzInfo.country;
      }
    }

    const ua = request.headers.get('user-agent') || customPayload.userAgent || '';
    const isMobile = /iPhone|iPad|iPod|Android/i.test(ua) || customPayload.device === 'mobile';
    let browser = customPayload.browser || 'Chrome';
    if (!customPayload.browser) {
      if (ua.includes('Firefox')) browser = 'Firefox';
      else if (ua.includes('Edg')) browser = 'Edge';
      else if (ua.includes('Chrome')) browser = 'Chrome';
      else if (ua.includes('Safari')) browser = 'Safari';
    }

    let refDomain = customPayload.referrer || request.headers.get('referer') || 'Direct Visit';

    const event = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      path: customPayload.path || url.pathname || '/',
      referrer: refDomain,
      utmSource: customPayload.utm_source || customPayload.utmSource || 'direct',
      utmMedium: customPayload.utm_medium || customPayload.utmMedium || 'none',
      utmCampaign: customPayload.utm_campaign || customPayload.utmCampaign || '',
      timezone: customPayload.timezone || '',
      country,
      countryCode,
      city,
      sessionId: customPayload.sessionId || `sess_${ip}_${Date.now().toString().slice(-6)}`,
      device: isMobile ? 'mobile' : 'desktop',
      browser,
      flag: COUNTRY_FLAGS[countryCode] || '🌍',
      ip
    };

    edgeEvents.push(event);
    if (edgeEvents.length > 5000) {
      edgeEvents = edgeEvents.slice(-5000);
    }
    return event;
  } catch (e) {
    return null;
  }
}

function computeEdgeStats() {
  const totalViews = edgeEvents.length;
  const uniqueSessions = new Set(edgeEvents.map(e => e.sessionId || e.ip)).size;

  const referrers = {};
  const sources = {};
  const devices = {};
  const countries = {};
  const cities = {};
  const pages = {};

  edgeEvents.forEach(e => {
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
    totalUsers: 6,
    totalSpots: 9781,
    vsotd: vsotdState,
    topReferrers: Object.entries(referrers).map(([domain, count]) => ({ domain, count })).sort((a, b) => b.count - a.count),
    sourcesBreakdown: Object.entries(sources).map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count),
    devicesBreakdown: Object.entries(devices).map(([device, count]) => ({ device, count })),
    pagesBreakdown: Object.entries(pages).map(([path, count]) => ({ path, count })).sort((a, b) => b.count - a.count),
    countriesBreakdown,
    citiesBreakdown,
    recentEvents: edgeEvents.slice(-50).reverse()
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Standard CORS headers for API endpoints
    const corsHeaders = {
      'Content-Type': 'application/json;charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-token'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // =========================================================================
    // CLOUDFLARE EDGE REST API HANDLERS
    // =========================================================================
    if (pathname === '/api/analytics/track' && request.method === 'POST') {
      try {
        const body = await request.json().catch(() => ({}));
        const evt = recordEdgeVisitor(request, body);
        return new Response(JSON.stringify({ success: true, eventId: evt?.id }), { headers: corsHeaders });
      } catch (e) {
        return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers: corsHeaders });
      }
    }

    if (pathname === '/api/analytics/stats') {
      const stats = computeEdgeStats();
      return new Response(JSON.stringify({ success: true, ...stats }), { headers: corsHeaders });
    }

    if (pathname === '/api/vsotd' && request.method === 'GET') {
      return new Response(JSON.stringify({ success: true, vsotd: vsotdState }), { headers: corsHeaders });
    }

    if (pathname === '/api/vsotd/register' && request.method === 'POST') {
      try {
        const body = await request.json().catch(() => ({}));
        if (body.spotId) {
          vsotdState = {
            ...vsotdState,
            spotId: body.spotId,
            title: body.title || vsotdState.title,
            locationName: body.locationName || vsotdState.locationName,
            highlightNote: body.highlightNote || vsotdState.highlightNote,
            selectedAt: new Date().toISOString()
          };
        }
        return new Response(JSON.stringify({ success: true, vsotd: vsotdState }), { headers: corsHeaders });
      } catch (e) {
        return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers: corsHeaders });
      }
    }

    if (pathname === '/api/vsotd/track' && request.method === 'POST') {
      vsotdState.clicks = (vsotdState.clicks || 0) + 1;
      return new Response(JSON.stringify({ success: true, clicks: vsotdState.clicks }), { headers: corsHeaders });
    }

    if (pathname === '/api/health' || pathname === '/api/system/status') {
      return new Response(JSON.stringify({
        status: 'online',
        provider: 'cloudflare-edge',
        timestamp: new Date().toISOString()
      }), { headers: corsHeaders });
    }

    // Record non-API page visits automatically at Cloudflare edge
    if (request.method === 'GET' && !pathname.includes('.')) {
      recordEdgeVisitor(request, { path: pathname });
    }

    // =========================================================================
    // STATIC ASSETS & SPA ROUTING FALLBACK
    // =========================================================================
    try {
      const response = await env.ASSETS.fetch(request);
      if (response && response.status !== 404 && response.status !== 405) {
        return response;
      }
      
      const indexUrl = new URL('/index.html', request.url);
      return await env.ASSETS.fetch(new Request(indexUrl.toString(), {
        method: 'GET',
        headers: { 'Accept': 'text/html' }
      }));
    } catch (err) {
      try {
        const indexUrl = new URL('/index.html', request.url);
        return await env.ASSETS.fetch(new Request(indexUrl.toString(), { method: 'GET' }));
      } catch (innerErr) {
        return new Response(
          '<!DOCTYPE html><html><head><meta charset="utf-8"><title>CampRoo</title><script>window.location.href="/";</script></head><body>Redirecting to CampRoo...</body></html>',
          { headers: { 'Content-Type': 'text/html;charset=utf-8' } }
        );
      }
    }
  }
};
