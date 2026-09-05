import { Router } from "express";
import { db } from "../services/db.js";
import { requireAdminAuth } from "../services/adminAuth.js";

const TIMEZONE_MAP = {
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
  'Europe/Moscow': { country: 'Russia', countryCode: 'RU', city: 'Moscow' },
  'Asia/Tokyo': { country: 'Japan', countryCode: 'JP', city: 'Tokyo' },
  'Asia/Shanghai': { country: 'China', countryCode: 'CN', city: 'Shanghai' },
  'Asia/Kolkata': { country: 'India', countryCode: 'IN', city: 'Mumbai' },
  'Asia/Seoul': { country: 'South Korea', countryCode: 'KR', city: 'Seoul' },
  'Australia/Sydney': { country: 'Australia', countryCode: 'AU', city: 'Sydney' },
  'Australia/Melbourne': { country: 'Australia', countryCode: 'AU', city: 'Melbourne' },
  'America/Mexico_City': { country: 'Mexico', countryCode: 'MX', city: 'Mexico City' },
  'America/Sao_Paulo': { country: 'Brazil', countryCode: 'BR', city: 'São Paulo' },
  'Africa/Cairo': { country: 'Egypt', countryCode: 'EG', city: 'Cairo' },
  'Africa/Johannesburg': { country: 'South Africa', countryCode: 'ZA', city: 'Johannesburg' },
  'Asia/Singapore': { country: 'Singapore', countryCode: 'SG', city: 'Singapore' },
  'Asia/Bangkok': { country: 'Thailand', countryCode: 'TH', city: 'Bangkok' },
  'Asia/Jakarta': { country: 'Indonesia', countryCode: 'ID', city: 'Jakarta' },
  'Asia/Manila': { country: 'Philippines', countryCode: 'PH', city: 'Manila' },
  'Asia/Karachi': { country: 'Pakistan', countryCode: 'PK', city: 'Karachi' },
  'Asia/Dhaka': { country: 'Bangladesh', countryCode: 'BD', city: 'Dhaka' },
  'America/Buenos_Aires': { country: 'Argentina', countryCode: 'AR', city: 'Buenos Aires' },
  'America/Bogota': { country: 'Colombia', countryCode: 'CO', city: 'Bogotá' },
  'America/Lima': { country: 'Peru', countryCode: 'PE', city: 'Lima' },
  'Europe/Istanbul': { country: 'Turkey', countryCode: 'TR', city: 'Istanbul' },
  'Europe/Warsaw': { country: 'Poland', countryCode: 'PL', city: 'Warsaw' },
  'Europe/Zurich': { country: 'Switzerland', countryCode: 'CH', city: 'Zurich' },
  'Europe/Stockholm': { country: 'Sweden', countryCode: 'SE', city: 'Stockholm' },
  'Europe/Oslo': { country: 'Norway', countryCode: 'NO', city: 'Oslo' },
  'Europe/Copenhagen': { country: 'Denmark', countryCode: 'DK', city: 'Copenhagen' },
  'Europe/Helsinki': { country: 'Finland', countryCode: 'FI', city: 'Helsinki' },
  'Asia/Muscat': { country: 'Oman', countryCode: 'OM', city: 'Muscat' },
  'Asia/Qatar': { country: 'Qatar', countryCode: 'QA', city: 'Doha' },
  'Asia/Bahrain': { country: 'Bahrain', countryCode: 'BH', city: 'Manama' },
  'Asia/Kuwait': { country: 'Kuwait', countryCode: 'KW', city: 'Kuwait City' },
  'Asia/Beirut': { country: 'Lebanon', countryCode: 'LB', city: 'Beirut' },
  'Asia/Jerusalem': { country: 'Israel', countryCode: 'IL', city: 'Tel Aviv' },
  'Asia/Amman': { country: 'Jordan', countryCode: 'JO', city: 'Amman' },
  'Asia/Baghdad': { country: 'Iraq', countryCode: 'IQ', city: 'Baghdad' },
};

export const COUNTRY_FLAGS = {
  US: '🇺🇸', AE: '🇦🇪', CA: '🇨🇦', GB: '🇬🇧', FR: '🇫🇷', DE: '🇩🇪', ES: '🇪🇸',
  IT: '🇮🇹', NL: '🇳🇱', RU: '🇷🇺', JP: '🇯🇵', CN: '🇨🇳', IN: '🇮🇳', KR: '🇰🇷',
  AU: '🇦🇺', MX: '🇲🇽', BR: '🇧🇷', EG: '🇪🇬', ZA: '🇿🇦', SG: '🇸🇬', TH: '🇹🇭',
  ID: '🇮🇩', PH: '🇵🇭', PK: '🇵🇰', BD: '🇧🇩', AR: '🇦🇷', CO: '🇨🇴', PE: '🇵🇪',
  TR: '🇹🇷', PL: '🇵🇱', CH: '🇨🇭', SE: '🇸🇪', NO: '🇳🇴', DK: '🇩🇰', FI: '🇫🇮',
  SA: '🇸🇦', OM: '🇴🇲', QA: '🇶🇦', BH: '🇧🇭', KW: '🇰🇼', LB: '🇱🇧', IL: '🇮🇱',
  JO: '🇯🇴', IQ: '🇮🇶',
};

function resolveLocationFromTimezone(timezone) {
  return TIMEZONE_MAP[timezone] || { country: 'Unknown', countryCode: 'UN', city: 'Unknown' };
}

export const analyticsRouter = Router();

/**
 * Public tracking endpoint - captures real website traffic
 */
analyticsRouter.post("/track", (req, res) => {
  try {
    const clientIp = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || 
                     req.socket?.remoteAddress || 
                     req.ip || 
                     "127.0.0.1";

    const userAgent = req.headers["user-agent"] || "Unknown";
    
    let country = 'Unknown', countryCode = 'UN', city = 'Unknown';
    const proxyCountry = req.headers['cf-ipcountry'] || req.headers['x-vercel-ip-country'];
    
    if (proxyCountry) {
      countryCode = proxyCountry;
      if (req.body.timezone) {
        const loc = resolveLocationFromTimezone(req.body.timezone);
        country = loc.country;
        city = loc.city;
      }
    } else if (req.body.timezone) {
      const loc = resolveLocationFromTimezone(req.body.timezone);
      country = loc.country;
      countryCode = loc.countryCode;
      city = loc.city;
    }

    const event = db.recordTrafficEvent({
      path: req.body.path || "/",
      referrer: req.body.referrer || req.headers["referer"] || "Direct",
      utmSource: req.body.utm_source || "direct",
      utmMedium: req.body.utm_medium || "none",
      utmCampaign: req.body.utm_campaign || "",
      utmContent: req.body.utm_content || "",
      timezone: req.body.timezone || "",
      country,
      countryCode,
      city,
      sessionId: req.body.sessionId || `sess_${Date.now()}`,
      device: req.body.device || "desktop",
      browser: req.body.browser || "Unknown",
      screenWidth: req.body.screenWidth || 0,
      ip: clientIp,
      userAgent: userAgent.slice(0, 180)
    });

    res.json({ success: true, eventId: event.id });
  } catch (err) {
    console.error("[Analytics Track Error]", err);
    res.status(500).json({ success: false, error: "Failed to record traffic event" });
  }
});

/**
 * Protected traffic stats endpoint - STRICTLY RESTRICTED to admin aziz
 */
analyticsRouter.get("/stats", requireAdminAuth, (req, res) => {
  try {
    const stats = db.getTrafficStats();
    res.json({
      success: true,
      ...stats
    });
  } catch (err) {
    console.error("[Analytics Stats Error]", err);
    res.status(500).json({ success: false, error: "Failed to load traffic statistics" });
  }
});