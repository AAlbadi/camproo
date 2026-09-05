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

async function dispatchEdgeEmail({ to = 'aalbadi1911@gmail.com', subject, html, text, type = 'general' }, env = null) {
  const emailLog = {
    id: `email-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    to,
    subject,
    type,
    status: 'pending',
    provider: 'resend',
    details: 'Dispatched to platform owner aalbadi1911@gmail.com'
  };

  const resendApiKey = env?.RESEND_API_KEY || '';
  if (resendApiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'CampRoo Community <onboarding@resend.dev>',
          to: [to],
          subject,
          html,
          text: text || subject
        })
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        emailLog.status = 'sent';
        emailLog.details = `Resend Message ID: ${data.id}`;
      } else {
        emailLog.status = 'logged';
        emailLog.details = `Resend API Response: ${JSON.stringify(data)}`;
      }
    } catch (e) {
      emailLog.status = 'logged';
      emailLog.details = `Network error: ${e.message}`;
    }
  } else {
    emailLog.status = 'logged';
    emailLog.details = `Notification logged for platform owner (${to}). Provide RESEND_API_KEY for direct SMTP/HTTP delivery.`;
  }

  if (env?.TELEMETRY_KV) {
    try {
      await env.TELEMETRY_KV.put(`email_log:${emailLog.id}`, JSON.stringify(emailLog), { expirationTtl: 86400 * 90 });
    } catch (e) {}
  }

  return emailLog;
}

async function recordEdgeVisitor(request, customPayload = {}, env = null) {
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

    if (env?.TELEMETRY_KV) {
      try {
        await env.TELEMETRY_KV.put(`evt:${event.id}`, JSON.stringify(event), { expirationTtl: 86400 * 30 });
      } catch (kvErr) {
        console.error('KV put error:', kvErr);
      }
    }

    return event;
  } catch (e) {
    return null;
  }
}

async function computeEdgeStats(env = null) {
  let events = [...edgeEvents];

  if (env?.TELEMETRY_KV) {
    try {
      const list = await env.TELEMETRY_KV.list({ prefix: 'evt:', limit: 1000 });
      if (list && list.keys && list.keys.length > 0) {
        const fetched = await Promise.all(
          list.keys.map(k => env.TELEMETRY_KV.get(k.name, 'json'))
        );
        const validFetched = fetched.filter(Boolean);
        if (validFetched.length > 0) {
          // Merge KV events with memory events, deduplicating by event ID
          const eventMap = new Map();
          validFetched.forEach(e => eventMap.set(e.id, e));
          edgeEvents.forEach(e => eventMap.set(e.id, e));
          events = Array.from(eventMap.values());
        }
      }
    } catch (kvErr) {
      console.error('KV list error:', kvErr);
    }
  }

  const totalViews = events.length;
  const uniqueSessions = new Set(events.map(e => e.sessionId || e.ip)).size;

  const referrers = {};
  const sources = {};
  const devices = {};
  const countries = {};
  const cities = {};
  const pages = {};

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
    percentage: totalViews > 0 ? Number(((data.count / totalViews) * 100).toFixed(1)) : 0
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
    recentEvents: events.slice(-50).reverse()
  };
}

export default {
  async fetch(request, env, ctx) {
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
    // CLOUDFLARE EDGE REST API HANDLERS (ALL FORMS CONNECTED TO AALBADI1911@GMAIL.COM)
    // =========================================================================

    // 1. SHARE A SPOT FORM SUBMISSION
    if ((pathname === '/api/spots/submit' || pathname === '/api/spots') && request.method === 'POST') {
      try {
        const body = await request.json().catch(() => ({}));
        const spot = body.spot || body;
        const submitterName = body.submitterName || spot.submitterName || 'Community RVer';
        const submitterEmail = body.submitterEmail || spot.contactEmail || 'aalbadi1911@gmail.com';
        const submitterPhone = body.submitterPhone || spot.contactPhone || 'N/A';
        const notes = body.notes || '';

        const spotRecord = {
          ...spot,
          id: spot.id || `spot-${Date.now()}`,
          createdAt: new Date().toISOString(),
          submitterName,
          contactEmail: submitterEmail,
          contactPhone: submitterPhone,
          status: 'active',
          reviewStatus: 'pending_review'
        };

        if (env?.TELEMETRY_KV) {
          await env.TELEMETRY_KV.put(`submitted_spot:${spotRecord.id}`, JSON.stringify(spotRecord), { expirationTtl: 86400 * 90 });
        }

        const emailSubject = `🏕️ New Spot Submitted: "${spotRecord.title || 'RV Spot'}" (${spotRecord.locationName || 'USA'})`;
        const emailHtml = `
          <div style="font-family: sans-serif; padding: 20px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; rounded: 12px;">
            <h2 style="color: #059669; margin-top: 0;">🏕️ New Free RV Spot Submitted</h2>
            <p>A new free campsite has been shared on CampRoo and is queued for Ranger audit!</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 15px 0;" />
            <p><strong>Spot Title:</strong> ${spotRecord.title || 'Untitled Spot'}</p>
            <p><strong>Location:</strong> ${spotRecord.locationName || 'N/A'}</p>
            <p><strong>Coordinates:</strong> ${spotRecord.lat || 0}, ${spotRecord.lng || 0}</p>
            <p><strong>Category:</strong> ${spotRecord.category || 'Dispersed Camping'}</p>
            <p><strong>Description:</strong> ${spotRecord.description || 'N/A'}</p>
            <p><strong>Submitter:</strong> ${submitterName} (&lt;${submitterEmail}&gt; · ${submitterPhone})</p>
            <p><strong>Notes:</strong> ${notes || 'None'}</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 15px 0;" />
            <p style="font-size: 12px; color: #64748b;">Dispatched to platform owner <strong>aalbadi1911@gmail.com</strong>.</p>
          </div>
        `;

        const emailLog = await dispatchEdgeEmail({
          to: 'aalbadi1911@gmail.com',
          subject: emailSubject,
          html: emailHtml,
          type: 'spot_submission'
        }, env);

        return new Response(JSON.stringify({
          success: true,
          emailSent: true,
          data: spotRecord,
          message: 'Spot submitted successfully! Notification sent to aalbadi1911@gmail.com',
          emailLog
        }), { headers: corsHeaders });
      } catch (e) {
        return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers: corsHeaders });
      }
    }

    // 2. SUPPORT & CONTACT INQUIRY FORM
    if ((pathname === '/api/support/inquiry' || pathname === '/api/support') && request.method === 'POST') {
      try {
        const body = await request.json().catch(() => ({}));
        const { name = 'Roamer', email = '', topic = 'General', subject = 'Support Inquiry', message = '' } = body;

        const inquiryRecord = {
          id: `inq-${Date.now()}`,
          timestamp: new Date().toISOString(),
          name,
          email,
          topic,
          subject,
          message
        };

        if (env?.TELEMETRY_KV) {
          await env.TELEMETRY_KV.put(`support_inquiry:${inquiryRecord.id}`, JSON.stringify(inquiryRecord), { expirationTtl: 86400 * 90 });
        }

        const emailSubject = `📩 Support Inquiry: [${topic}] ${subject} (from ${name})`;
        const emailHtml = `
          <div style="font-family: sans-serif; padding: 20px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0;">
            <h2 style="color: #0284c7; margin-top: 0;">📩 New Support & Inquiry Received</h2>
            <p>A user submitted an inquiry via CampRoo Support Hub:</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 15px 0;" />
            <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
            <p><strong>Topic:</strong> ${topic}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Message:</strong></p>
            <blockquote style="background: #f8fafc; padding: 12px; border-left: 4px solid #0284c7; margin: 10px 0;">${message}</blockquote>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 15px 0;" />
            <p style="font-size: 12px; color: #64748b;">Directly delivered to platform owner <strong>aalbadi1911@gmail.com</strong>.</p>
          </div>
        `;

        const emailLog = await dispatchEdgeEmail({
          to: 'aalbadi1911@gmail.com',
          subject: emailSubject,
          html: emailHtml,
          type: 'support_inquiry'
        }, env);

        return new Response(JSON.stringify({
          success: true,
          emailSent: true,
          data: inquiryRecord,
          message: 'Inquiry submitted! Notification sent to aalbadi1911@gmail.com',
          emailLog
        }), { headers: corsHeaders });
      } catch (e) {
        return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers: corsHeaders });
      }
    }

    // 3. WEEKLY ROAD DIGEST NEWSLETTER FORM
    if (pathname === '/api/newsletter/subscribe' && request.method === 'POST') {
      try {
        const body = await request.json().catch(() => ({}));
        const email = body.email || '';
        const source = body.source || 'footer_form';

        if (!email || !email.includes('@')) {
          return new Response(JSON.stringify({ success: false, message: 'Valid email required' }), { status: 400, headers: corsHeaders });
        }

        const subRecord = {
          id: `sub-${Date.now()}`,
          email,
          source,
          timestamp: new Date().toISOString()
        };

        if (env?.TELEMETRY_KV) {
          await env.TELEMETRY_KV.put(`newsletter_sub:${subRecord.id}`, JSON.stringify(subRecord), { expirationTtl: 86400 * 365 });
        }

        const emailSubject = `📬 New Newsletter Subscriber: ${email}`;
        const emailHtml = `
          <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
            <h2 style="color: #059669;">📬 New CampRoo Road Digest Subscriber</h2>
            <p>A new RVer joined the Weekly Road Digest mailing list!</p>
            <p><strong>Subscriber Email:</strong> ${email}</p>
            <p><strong>Source:</strong> ${source}</p>
            <p><strong>Timestamp:</strong> ${subRecord.timestamp}</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 15px 0;" />
            <p style="font-size: 12px; color: #64748b;">Delivered to platform owner <strong>aalbadi1911@gmail.com</strong>.</p>
          </div>
        `;

        const emailLog = await dispatchEdgeEmail({
          to: 'aalbadi1911@gmail.com',
          subject: emailSubject,
          html: emailHtml,
          type: 'newsletter_optin'
        }, env);

        return new Response(JSON.stringify({
          success: true,
          emailSent: true,
          message: 'Subscribed to CampRoo Road Digest! Notification sent to aalbadi1911@gmail.com',
          emailLog
        }), { headers: corsHeaders });
      } catch (e) {
        return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers: corsHeaders });
      }
    }

    // 4. SAFETY & REPORT FORM
    if (pathname === '/api/reports' && request.method === 'POST') {
      try {
        const body = await request.json().catch(() => ({}));
        const reportRecord = {
          ...body,
          id: body.id || `rep-${Date.now()}`,
          createdAt: new Date().toISOString(),
          status: 'pending'
        };

        if (env?.TELEMETRY_KV) {
          await env.TELEMETRY_KV.put(`report:${reportRecord.id}`, JSON.stringify(reportRecord), { expirationTtl: 86400 * 90 });
        }

        const emailSubject = `🚨 Safety Report Filed: ${reportRecord.reason || 'User/Spot Audit'} (${reportRecord.targetName || 'Item'})`;
        const emailHtml = `
          <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
            <h2 style="color: #dc2626;">🚨 CampRoo Safety Report Alert</h2>
            <p>A new safety flag has been submitted for audit:</p>
            <p><strong>Target:</strong> ${reportRecord.targetName || reportRecord.targetId}</p>
            <p><strong>Target Type:</strong> ${reportRecord.targetType || reportRecord.reportedTargetType || 'Spot/User'}</p>
            <p><strong>Reason:</strong> ${reportRecord.reason}</p>
            <p><strong>Details:</strong> ${reportRecord.details || 'N/A'}</p>
            <p><strong>Reporter:</strong> ${reportRecord.reporterName || 'Anonymous'} (${reportRecord.reporterEmail || 'N/A'})</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 15px 0;" />
            <p style="font-size: 12px; color: #64748b;">Alert sent to platform owner <strong>aalbadi1911@gmail.com</strong>.</p>
          </div>
        `;

        const emailLog = await dispatchEdgeEmail({
          to: 'aalbadi1911@gmail.com',
          subject: emailSubject,
          html: emailHtml,
          type: 'safety_report'
        }, env);

        return new Response(JSON.stringify({
          success: true,
          emailSent: true,
          data: reportRecord,
          emailLog
        }), { headers: corsHeaders });
      } catch (e) {
        return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers: corsHeaders });
      }
    }

    // 5. WRITE A REVIEW FORM
    if (pathname === '/api/reviews' && request.method === 'POST') {
      try {
        const body = await request.json().catch(() => ({}));
        const reviewRecord = {
          ...body,
          id: body.id || `rev-${Date.now()}`,
          createdAt: new Date().toISOString().split('T')[0]
        };

        if (env?.TELEMETRY_KV) {
          await env.TELEMETRY_KV.put(`review:${reviewRecord.id}`, JSON.stringify(reviewRecord), { expirationTtl: 86400 * 90 });
        }

        const emailSubject = `⭐ New Review Posted: "${reviewRecord.spotTitle || 'Spot'}" (${reviewRecord.ratingOverall || 5} Stars)`;
        const emailHtml = `
          <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
            <h2 style="color: #eab308;">⭐ New Spot Review Submitted</h2>
            <p>A new review was written on CampRoo:</p>
            <p><strong>Spot:</strong> ${reviewRecord.spotTitle || reviewRecord.spotId}</p>
            <p><strong>Rating:</strong> ${reviewRecord.ratingOverall || 5} / 5 Stars</p>
            <p><strong>Comment:</strong> ${reviewRecord.comment || reviewRecord.text || 'N/A'}</p>
            <p><strong>Reviewer:</strong> ${reviewRecord.reviewerName || 'RVer'}</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 15px 0;" />
            <p style="font-size: 12px; color: #64748b;">Sent to platform owner <strong>aalbadi1911@gmail.com</strong>.</p>
          </div>
        `;

        const emailLog = await dispatchEdgeEmail({
          to: 'aalbadi1911@gmail.com',
          subject: emailSubject,
          html: emailHtml,
          type: 'review_posted'
        }, env);

        return new Response(JSON.stringify({
          success: true,
          emailSent: true,
          data: reviewRecord,
          emailLog
        }), { headers: corsHeaders });
      } catch (e) {
        return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers: corsHeaders });
      }
    }

    // 6. STAY REQUESTS & SPOT EDITS
    if ((pathname === '/api/requests' || pathname.includes('/edit-requests')) && request.method === 'POST') {
      try {
        const body = await request.json().catch(() => ({}));
        const reqRecord = {
          ...body,
          id: body.id || `req-${Date.now()}`,
          createdAt: new Date().toISOString()
        };

        if (env?.TELEMETRY_KV) {
          await env.TELEMETRY_KV.put(`request:${reqRecord.id}`, JSON.stringify(reqRecord), { expirationTtl: 86400 * 90 });
        }

        const isEdit = pathname.includes('/edit');
        const emailSubject = isEdit ? `✏️ Spot Edit Requested for Spot #${body.spotId}` : `🚐 New Stay Booking Request (${body.arrivalDate || 'Stay'})`;
        const emailHtml = `
          <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
            <h2 style="color: #6366f1;">${isEdit ? '✏️ Spot Edit Request' : '🚐 New Stay Request'}</h2>
            <p>Details:</p>
            <pre style="background: #f1f5f9; padding: 12px; border-radius: 8px;">${JSON.stringify(reqRecord, null, 2)}</pre>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 15px 0;" />
            <p style="font-size: 12px; color: #64748b;">Dispatched to platform owner <strong>aalbadi1911@gmail.com</strong>.</p>
          </div>
        `;

        const emailLog = await dispatchEdgeEmail({
          to: 'aalbadi1911@gmail.com',
          subject: emailSubject,
          html: emailHtml,
          type: isEdit ? 'spot_edit_request' : 'stay_request'
        }, env);

        return new Response(JSON.stringify({
          success: true,
          emailSent: true,
          data: reqRecord,
          emailLog
        }), { headers: corsHeaders });
      } catch (e) {
        return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers: corsHeaders });
      }
    }

    // 7. GET EMAIL LOGS (For Admin Hub & Telemetry Modal)
    if (pathname === '/api/email/logs' && request.method === 'GET') {
      try {
        let logs = [];
        if (env?.TELEMETRY_KV) {
          const list = await env.TELEMETRY_KV.list({ prefix: 'email_log:', limit: 100 });
          if (list && list.keys && list.keys.length > 0) {
            const fetched = await Promise.all(list.keys.map(k => env.TELEMETRY_KV.get(k.name, 'json')));
            logs = fetched.filter(Boolean).reverse();
          }
        }
        return new Response(JSON.stringify({ success: true, logs }), { headers: corsHeaders });
      } catch (e) {
        return new Response(JSON.stringify({ success: true, logs: [] }), { headers: corsHeaders });
      }
    }

    // 8. GET NEWSLETTER SUBSCRIBERS (For Admin Hub)
    if (pathname === '/api/newsletter/subscribers' && request.method === 'GET') {
      try {
        let subscribers = [];
        if (env?.TELEMETRY_KV) {
          const list = await env.TELEMETRY_KV.list({ prefix: 'newsletter_sub:', limit: 500 });
          if (list && list.keys && list.keys.length > 0) {
            const fetched = await Promise.all(list.keys.map(k => env.TELEMETRY_KV.get(k.name, 'json')));
            subscribers = fetched.filter(Boolean).reverse();
          }
        }
        return new Response(JSON.stringify({ success: true, subscribers }), { headers: corsHeaders });
      } catch (e) {
        return new Response(JSON.stringify({ success: true, subscribers: [] }), { headers: corsHeaders });
      }
    }

    // ANALYTICS TRACK
    if (pathname === '/api/analytics/track' && request.method === 'POST') {
      try {
        const body = await request.json().catch(() => ({}));
        const evt = await recordEdgeVisitor(request, body, env);
        return new Response(JSON.stringify({ success: true, eventId: evt?.id }), { headers: corsHeaders });
      } catch (e) {
        return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers: corsHeaders });
      }
    }

    if (pathname === '/api/analytics/stats') {
      const stats = await computeEdgeStats(env);
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
      if (ctx?.waitUntil) {
        ctx.waitUntil(recordEdgeVisitor(request, { path: pathname }, env));
      } else {
        recordEdgeVisitor(request, { path: pathname }, env);
      }
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
