import { db } from './db.js';

/**
 * CampRoo Unified Email Service
 * Supports:
 * 1. Resend (Default recommended - uses simple HTTP API, no npm package strictly required)
 * 2. SendGrid (Bearer token HTTP API)
 * 3. Mock Sandbox (Logs to DB & console, previews email in UI for easy local dev)
 */

const getResendApiKey = () => process.env.RESEND_API_KEY || '';
const getSendgridApiKey = () => process.env.SENDGRID_API_KEY || '';
const getEmailFrom = () => process.env.EMAIL_FROM || 'CampRoo <onboarding@resend.dev>';

/**
 * Send an email via active provider or sandbox
 */
export async function sendEmail({ to, subject, html, text, type = 'general' }) {
  // 1. If Resend API Key is provided, use Resend HTTP API
  const resendKey = getResendApiKey();
  const emailFrom = getEmailFrom();
  if (resendKey && !resendKey.includes('your_')) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: emailFrom,
          to: [to],
          subject,
          html,
          text
        })
      });

      const data = await res.json();
      if (res.ok) {
        db.logEmail({
          to,
          subject,
          type,
          status: 'sent',
          provider: 'resend',
          details: `Message ID: ${data.id}`
        });
        return { success: true, provider: 'resend', messageId: data.id };
      } else {
        console.error('[EmailService] Resend API error:', data);
        db.logEmail({
          to,
          subject,
          type,
          status: 'error',
          provider: 'resend',
          details: JSON.stringify(data)
        });
      }
    } catch (err) {
      console.error('[EmailService] Resend network error:', err);
    }
  }

  // 2. If SendGrid API Key is provided
  const sendgridKey = getSendgridApiKey();
  if (sendgridKey && !sendgridKey.includes('your_')) {
    try {
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sendgridKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: emailFrom.replace(/.*<(.+)>/, '$1') || 'hello@camproo.com', name: 'CampRoo Community' },
          subject,
          content: [
            { type: 'text/html', value: html },
            { type: 'text/plain', value: text || '' }
          ]
        })
      });

      if (res.ok || res.status === 202) {
        db.logEmail({
          to,
          subject,
          type,
          status: 'sent',
          provider: 'sendgrid',
          details: 'Accepted for delivery'
        });
        return { success: true, provider: 'sendgrid' };
      }
    } catch (err) {
      console.error('[EmailService] SendGrid error:', err);
    }
  }

  // 3. Fallback / Local Sandbox Mode: Logs to DB and console with instant preview
  console.log(`\n========================================`);
  console.log(`[EMAIL SANDBOX] To: ${to}`);
  console.log(`[EMAIL SANDBOX] Subject: ${subject}`);
  console.log(`[EMAIL SANDBOX] Type: ${type}`);
  console.log(`[EMAIL SANDBOX] (Provide RESEND_API_KEY in .env to deliver real emails)`);
  console.log(`========================================\n`);

  const log = db.logEmail({
    to,
    subject,
    type,
    status: 'delivered_sandbox',
    provider: 'sandbox_local',
    details: 'Simulated delivery recorded in database. Ready for live API key.'
  });

  return {
    success: true,
    provider: 'sandbox',
    logId: log.id,
    note: 'Delivered to local sandbox log'
  };
}

/**
 * Generate and dispatch Welcome Email
 */
export async function sendWelcomeEmail({ to, name, newsletterOptIn = false }) {
  const subject = `Welcome to CampRoo, ${name || 'Explorer'}! 🚐 Your Roaming Journey Begins`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8F9FA; margin: 0; padding: 30px 15px; color: #1E293B; }
          .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 15px rgba(0,0,0,0.04); }
          .header { background: linear-gradient(135deg, #10B981, #059669); padding: 35px 25px; text-align: center; color: #ffffff; }
          .logo { font-size: 28px; font-weight: 900; letter-spacing: -0.5px; }
          .badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 5px 14px; border-radius: 999px; font-size: 11px; font-weight: bold; margin-top: 8px; text-transform: uppercase; }
          .content { padding: 35px 30px; line-height: 1.6; }
          .h1 { font-size: 20px; font-weight: 800; color: #0F172A; margin-top: 0; }
          .callout { background: #ECFDF5; border-left: 4px solid #10B981; padding: 15px 20px; border-radius: 0 12px 12px 0; margin: 20px 0; font-size: 13px; color: #065F46; }
          .features { margin: 25px 0; }
          .feature-item { margin-bottom: 12px; display: flex; align-items: flex-start; gap: 10px; font-size: 13px; }
          .button { display: inline-block; background: #10B981; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 12px; margin-top: 15px; }
          .footer { background: #F1F5F9; padding: 20px; text-align: center; font-size: 11px; color: #64748B; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Camp<span style="color:#FEF08A;">Roo</span> 🦘</div>
            <div class="badge">100% Free USA RV & Spot Sharing</div>
          </div>
          <div class="content">
            <h1 class="h1">Welcome aboard, ${name || 'Fellow Roamer'}!</h1>
            <p>Your CampRoo account is live and active. You are now part of America's fastest-growing verified RV boondocking community.</p>

            <div class="callout">
              <strong>✨ What you can do right away:</strong>
              <ul style="margin: 8px 0 0; padding-left: 18px;">
                <li>Search & request 100% free overnight spots across all 50 states</li>
                <li>Directly chat with verified ranch, farm, and driveway hosts</li>
                <li>Filter by your exact rig length, power hookups, and pet policies</li>
              </ul>
            </div>

            ${newsletterOptIn ? `
              <p style="font-size: 13px; background: #FFFBEB; border: 1px solid #FDE68A; padding: 12px 16px; border-radius: 12px; color: #92400E;">
                📬 <strong>Newsletter confirmed:</strong> You're also subscribed to our weekly <em>CampRoo Road Digest</em> featuring newly opened host locations and scenic free camping coordinates!
              </p>
            ` : ''}

            <div style="text-align: center; margin: 30px 0 15px;">
              <a href="http://localhost:3000" class="button">Explore Free RV Spots Now &rarr;</a>
            </div>
          </div>
          <div class="footer">
            CampRoo Community Inc. · Made with ❤️ for nomadic adventurers across the USA.<br>
            You received this email because you signed up on CampRoo.
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to,
    subject,
    html,
    text: `Welcome to CampRoo, ${name}! Your account is now active. Explore free spots across the US anytime.`,
    type: 'welcome'
  });
}

/**
 * Generate and dispatch Newsletter Subscription Email
 */
export async function sendNewsletterConfirmationEmail({ to, name }) {
  const subject = `You're on the list! 📬 The CampRoo Weekly Road Digest`;

  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: -apple-system, sans-serif; background-color: #F8F9FA; padding: 30px 15px; color: #1E293B;">
        <div style="max-width: 550px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #E2E8F0; padding: 30px;">
          <h2 style="color: #0F172A; margin-top: 0;">📬 You're subscribed to CampRoo Road Digest!</h2>
          <p>Hey ${name || 'there'}, thanks for joining our community newsletter.</p>
          <p>Every Thursday, we send out:</p>
          <ul style="line-height: 1.7; font-size: 14px;">
            <li>🗺️ <strong>Top 5 newly verified free host spots</strong> added that week</li>
            <li>⛽ <strong>Diesel & propane savings tips</strong> across interstate corridors</li>
            <li>🛠️ <strong>Rig maintenance & boondocking safety tips</strong> from 10+ year veterans</li>
          </ul>
          <p style="font-size: 12px; color: #64748B; margin-top: 25px;">
            No spam, ever. You can unsubscribe with one click anytime.
          </p>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to,
    subject,
    html,
    text: `You're subscribed to the CampRoo Weekly Road Digest! Top free spots and tips incoming every week.`,
    type: 'newsletter_confirmation'
  });
}

/**
 * Generate and dispatch Spot Submission Review Email to the platform owner (aalbadi1911@gmail.com)
 */
export async function sendSpotSubmissionReviewEmail({
  spot,
  submitterName = 'RV Roamer',
  submitterEmail = 'unknown@camproo.com',
  submitterPhone = 'Not provided',
  visibility = 'public',
  notes = ''
}) {
  const adminEmail = 'aalbadi1911@gmail.com';
  const isPersonal = visibility === 'personal';
  const spotTitle = spot.title || 'Untitled RV Spot';
  const locationDesc = [spot.locationName, spot.generalArea].filter(Boolean).join(', ') || 'USA';
  const coords = spot.coordinates ? `${spot.coordinates[0]?.toFixed(4)}, ${spot.coordinates[1]?.toFixed(4)}` : 'N/A';
  const mapsUrl = spot.coordinates ? `https://www.google.com/maps?q=${spot.coordinates[0]},${spot.coordinates[1]}` : '';

  const subject = `🚐 [${isPersonal ? 'Personal Spot' : 'New Public Listing'}] "${spotTitle}" in ${locationDesc} - Ready for Review`;

  const mailtoBody = encodeURIComponent(
    `Hi ${submitterName},\n\nThank you for sharing your spot "${spotTitle}" on CampRoo!\n\nI have reviewed your submission and wanted to connect regarding your listing.\n\nBest regards,\nCampRoo Ranger Team`
  );
  const mailtoUrl = `mailto:${submitterEmail}?subject=${encodeURIComponent(`CampRoo Spot Review: ${spotTitle}`)}&body=${mailtoBody}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8F9FA; margin: 0; padding: 25px 15px; color: #1E293B; }
          .container { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
          .header { background: linear-gradient(135deg, ${isPersonal ? '#6366F1, #4F46E5' : '#10B981, #059669'}); padding: 30px 24px; text-align: center; color: #ffffff; }
          .badge { display: inline-block; background: rgba(255,255,255,0.25); padding: 5px 14px; border-radius: 999px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
          .title { font-size: 24px; font-weight: 900; margin: 10px 0 4px; }
          .subtitle { font-size: 13px; opacity: 0.9; margin: 0; }
          .content { padding: 30px 25px; line-height: 1.6; }
          .card { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: 18px 20px; margin-bottom: 20px; }
          .card-title { font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #64748B; margin-bottom: 12px; }
          .row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
          .label { color: #64748B; font-weight: 600; }
          .value { color: #0F172A; font-weight: 700; text-align: right; }
          .btn-primary { display: inline-block; background: #10B981; color: #ffffff !important; text-decoration: none; font-weight: 800; font-size: 14px; padding: 14px 28px; border-radius: 12px; box-shadow: 0 3px 10px rgba(16,185,129,0.3); }
          .btn-secondary { display: inline-block; background: #F1F5F9; color: #1E293B !important; text-decoration: none; font-weight: 700; font-size: 13px; padding: 10px 20px; border-radius: 10px; margin-left: 8px; }
          .photos-grid { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
          .photo-thumb { width: 120px; height: 80px; object-fit: cover; border-radius: 8px; border: 1px solid #CBD5E1; }
          .footer { background: #F8FAFC; padding: 20px; text-align: center; font-size: 11px; color: #64748B; border-top: 1px solid #E2E8F0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="badge">${isPersonal ? '🔒 Personal Spot Saved' : '🌐 New Public Spot Submission'}</div>
            <h1 class="title">${spotTitle}</h1>
            <p class="subtitle">${locationDesc} · ${spot.spaceType || 'RV Space'} (${spot.environment || 'Rural'})</p>
          </div>

          <div class="content">
            <!-- Action callout -->
            <div style="text-align: center; margin-bottom: 25px;">
              <a href="${mailtoUrl}" class="btn-primary">✉️ Reply to Host (${submitterEmail})</a>
              ${mapsUrl ? `<a href="${mapsUrl}" target="_blank" class="btn-secondary">🗺️ View on Google Maps</a>` : ''}
            </div>

            <!-- Submitter Information -->
            <div class="card" style="border-left: 4px solid #10B981;">
              <div class="card-title">👤 Submitter / Host Contact Info</div>
              <div class="row">
                <span class="label">Full Name:</span>
                <span class="value">${submitterName}</span>
              </div>
              <div class="row">
                <span class="label">Email Address:</span>
                <span class="value"><a href="${mailtoUrl}" style="color:#059669; text-decoration:underline;">${submitterEmail}</a></span>
              </div>
              <div class="row">
                <span class="label">Phone Number:</span>
                <span class="value">${submitterPhone}</span>
              </div>
              <div class="row">
                <span class="label">Submission Mode:</span>
                <span class="value" style="color: ${isPersonal ? '#6366F1' : '#059669'};">${isPersonal ? 'Personal (Private)' : 'Public (Community Listing)'}</span>
              </div>
            </div>

            <!-- Spot Details -->
            <div class="card">
              <div class="card-title">📍 Spot Location & Identity</div>
              <div class="row">
                <span class="label">Category:</span>
                <span class="value" style="font-weight:700; color:${spot.spotType === 'public' ? '#059669' : '#D97706'};">
                  ${spot.spotType === 'public' ? '🌲 Public Free Space (' + (spot._pipeline?.land_manager || 'Public Land') + ')' : '🏡 Hosted by a Person'}
                </span>
              </div>
              <div class="row">
                <span class="label">Spot Title:</span>
                <span class="value">${spotTitle}</span>
              </div>
              <div class="row">
                <span class="label">Tagline:</span>
                <span class="value">${spot.tagline || 'None'}</span>
              </div>
              <div class="row">
                <span class="label">City / State:</span>
                <span class="value">${locationDesc}</span>
              </div>
              <div class="row">
                <span class="label">Coordinates:</span>
                <span class="value">${coords}</span>
              </div>
              ${spot.exactAddressSecret ? `
                <div class="row" style="background:#FEF3C7; padding:6px 10px; border-radius:6px; margin-top:6px;">
                  <span class="label" style="color:#92400E;">Private Street Address:</span>
                  <span class="value" style="color:#92400E;">${spot.exactAddressSecret}</span>
                </div>
              ` : ''}
              ${spot.arrivalGateCodeSecret ? `
                <div class="row" style="background:#FEF3C7; padding:6px 10px; border-radius:6px; margin-top:4px;">
                  <span class="label" style="color:#92400E;">Private Gate / Arrival Code:</span>
                  <span class="value" style="color:#92400E;">${spot.arrivalGateCodeSecret}</span>
                </div>
              ` : ''}
              <div style="margin-top:12px; font-size:12px; color:#475569;">
                <strong>Host Description:</strong><br>
                ${spot.description || 'No description provided.'}
              </div>
            </div>

            <!-- Rig Compatibility -->
            <div class="card">
              <div class="card-title">🚐 Rig Compatibility</div>
              <div class="row">
                <span class="label">Max RV Length:</span>
                <span class="value">${spot.rigCompatibility?.maxLengthFt || 35} ft</span>
              </div>
              <div class="row">
                <span class="label">Max Height Clearance:</span>
                <span class="value">${spot.rigCompatibility?.maxHeightFt || 13.5} ft</span>
              </div>
              <div class="row">
                <span class="label">Access Type:</span>
                <span class="value">${spot.rigCompatibility?.accessType || 'pull_through'}</span>
              </div>
              <div class="row">
                <span class="label">Surface Type:</span>
                <span class="value">${spot.rigCompatibility?.surfaceType || 'packed_gravel'}</span>
              </div>
              <div class="row">
                <span class="label">Accepted Classes:</span>
                <span class="value">${(spot.rigCompatibility?.acceptedTypes || []).join(', ') || 'All Classes'}</span>
              </div>
              ${spot.rigCompatibility?.turnaroundSpace ? `
                <div style="margin-top:8px; font-size:12px; color:#475569;">
                  <strong>Turnaround notes:</strong> ${spot.rigCompatibility.turnaroundSpace}
                </div>
              ` : ''}
            </div>

            <!-- Hookups & Rules -->
            <div class="card">
              <div class="card-title">⚡ Hookups & Policies</div>
              <div class="row">
                <span class="label">Electricity:</span>
                <span class="value">${spot.amenities?.electricity || 'none'}</span>
              </div>
              <div class="row">
                <span class="label">Water:</span>
                <span class="value">${spot.amenities?.water || 'none'}</span>
              </div>
              <div class="row">
                <span class="label">Wi-Fi:</span>
                <span class="value">${spot.amenities?.wifi ? 'Available' : 'No'}</span>
              </div>
              <div class="row">
                <span class="label">Pets Allowed:</span>
                <span class="value">${spot.amenities?.petsAllowed ? 'Yes' : 'No'}</span>
              </div>
              <div class="row">
                <span class="label">Campfire Ring:</span>
                <span class="value">${spot.amenities?.firePit ? 'Yes' : 'No'}</span>
              </div>
              <div class="row">
                <span class="label">Max Stay:</span>
                <span class="value">${spot.rules?.maxStayNights || 3} Nights</span>
              </div>
            </div>

            <!-- Photos -->
            ${spot.photos && spot.photos.length > 0 ? `
              <div class="card">
                <div class="card-title">📸 Spot Photos (${spot.photos.length})</div>
                <div class="photos-grid">
                  ${spot.photos.map(p => `<img src="${p}" alt="Spot photo" class="photo-thumb" />`).join('')}
                </div>
              </div>
            ` : ''}

            ${notes ? `
              <div class="card" style="background:#FFFBEB; border-color:#FDE68A;">
                <div class="card-title" style="color:#92400E;">📝 Submitter Notes</div>
                <p style="font-size:13px; color:#78350F; margin:0;">${notes}</p>
              </div>
            ` : ''}

            <div style="text-align: center; margin-top: 30px;">
              <p style="font-size: 13px; color: #64748B;">
                You can review this submission and contact <strong>${submitterName}</strong> directly at <a href="${mailtoUrl}">${submitterEmail}</a>.
              </p>
              <a href="${mailtoUrl}" class="btn-primary">✉️ Reply via Email to ${submitterName}</a>
            </div>
          </div>

          <div class="footer">
            CampRoo Ranger Automated Review Hub · Notification sent for new spot submission.<br>
            Delivered directly to aalbadi1911@gmail.com
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: adminEmail,
    subject,
    html,
    text: `New ${isPersonal ? 'Personal' : 'Public'} Spot Submission: ${spotTitle} in ${locationDesc}. Submitter: ${submitterName} (${submitterEmail}, Phone: ${submitterPhone}). Reply directly to: ${submitterEmail}`,
    type: 'spot_submission_review'
  });
}

/**
 * Send submission receipt confirmation to the submitter
 */
export async function sendSpotSubmitterConfirmationEmail({
  to,
  name = 'Host',
  spotTitle = 'Your Spot'
}) {
  if (!to || !to.includes('@')) return { success: false, note: 'No valid recipient email' };

  const subject = `We received your CampRoo spot: "${spotTitle}" 🚐`;
  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: -apple-system, sans-serif; background-color: #F8F9FA; padding: 25px 15px; color: #1E293B;">
        <div style="max-width: 550px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #E2E8F0; padding: 25px;">
          <h2 style="color: #059669; margin-top: 0;">🚐 Thank you for sharing your spot!</h2>
          <p>Hi ${name},</p>
          <p>We received your submission for <strong>"${spotTitle}"</strong> on CampRoo. Your spot has been added to your dashboard.</p>
          <p>Our team is reviewing the listing details. If we have any questions, we'll reach out directly to this email address.</p>
          <p style="margin-top: 25px; font-size: 12px; color: #64748B;">
            Thank you for helping fellow RV travelers roam America freely and safely!
          </p>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to,
    subject,
    html,
    text: `Hi ${name}, we received your submission for "${spotTitle}" on CampRoo. Our team is reviewing the listing and will be in touch if needed.`,
    type: 'spot_submitter_receipt'
  });
}

export async function sendStayRequestAdminEmail({ travelerName, travelerEmail, spotTitle, spotLocation, arrivalDate, departureDate, nights, rigDescription, personalNote }) {
  const adminEmail = 'aalbadi1911@gmail.com';
  const subject = `🚐 [New Stay Request] "${spotTitle}" - ${travelerName} (${nights} nights)`;
  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: -apple-system, sans-serif; background-color: #F8F9FA; padding: 25px 15px; color: #1E293B;">
        <div style="max-width: 550px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #10B981, #059669); padding: 30px 24px; text-align: center; color: #ffffff;">
            <h2 style="margin: 0;">New Stay Request</h2>
          </div>
          <div style="padding: 25px;">
            <p><strong>Traveler:</strong> ${travelerName} (${travelerEmail})</p>
            <p><strong>Spot:</strong> ${spotTitle} - ${spotLocation}</p>
            <p><strong>Dates:</strong> ${arrivalDate} to ${departureDate} (${nights} nights)</p>
            <p><strong>Rig:</strong> ${rigDescription}</p>
            <p><strong>Note:</strong> ${personalNote}</p>
          </div>
        </div>
      </body>
    </html>
  `;
  return sendEmail({ to: adminEmail, subject, html, text: subject, type: 'stay_request' });
}

export async function sendNewReviewAdminEmail({ reviewerName, spotTitle, ratingOverall, categories, wouldWelcomeAgain, comment }) {
  const adminEmail = 'aalbadi1911@gmail.com';
  const subject = `⭐ [New Review] ${ratingOverall}/5 for "${spotTitle}" by ${reviewerName}`;
  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: -apple-system, sans-serif; background-color: #F8F9FA; padding: 25px 15px; color: #1E293B;">
        <div style="max-width: 550px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #10B981, #059669); padding: 30px 24px; text-align: center; color: #ffffff;">
            <h2 style="margin: 0;">New Review Submitted</h2>
          </div>
          <div style="padding: 25px;">
            <p><strong>Reviewer:</strong> ${reviewerName}</p>
            <p><strong>Spot:</strong> ${spotTitle}</p>
            <p><strong>Rating:</strong> ${ratingOverall}/5</p>
            <p><strong>Categories:</strong> ${JSON.stringify(categories)}</p>
            <p><strong>Would Welcome Again:</strong> ${wouldWelcomeAgain ? 'Yes' : 'No'}</p>
            <p><strong>Comment:</strong> ${comment}</p>
          </div>
        </div>
      </body>
    </html>
  `;
  return sendEmail({ to: adminEmail, subject, html, text: subject, type: 'new_review' });
}

export async function sendSafetyReportAdminEmail({ reporterName, reporterEmail, targetType, targetName, reason, details }) {
  const adminEmail = 'aalbadi1911@gmail.com';
  const subject = `🚨 [URGENT Safety Report] ${targetType}: "${targetName}" - ${reason}`;
  const reporterDisplay = reporterEmail ? `${reporterName} (${reporterEmail})` : reporterName;
  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: -apple-system, sans-serif; background-color: #F8F9FA; padding: 25px 15px; color: #1E293B;">
        <div style="max-width: 550px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #EF4444, #B91C1C); padding: 30px 24px; text-align: center; color: #ffffff;">
            <h2 style="margin: 0;">URGENT Safety Report</h2>
          </div>
          <div style="padding: 25px;">
            <p><strong>Reporter:</strong> ${reporterDisplay}</p>
            <p><strong>Target Type:</strong> ${targetType}</p>
            <p><strong>Target Name:</strong> ${targetName}</p>
            <p><strong>Reason:</strong> ${reason}</p>
            <p><strong>Details:</strong> ${details}</p>
          </div>
        </div>
      </body>
    </html>
  `;
  return sendEmail({ to: adminEmail, subject, html, text: subject, type: 'safety_report' });
}

export async function sendNewsletterSubscriberAdminEmail({ subscriberEmail, subscriberName, source, trafficSource }) {
  const adminEmail = 'aalbadi1911@gmail.com';
  const subject = `📬 [New Newsletter Subscriber] ${subscriberEmail} via ${source}`;
  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: -apple-system, sans-serif; background-color: #F8F9FA; padding: 25px 15px; color: #1E293B;">
        <div style="max-width: 550px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #10B981, #059669); padding: 30px 24px; text-align: center; color: #ffffff;">
            <h2 style="margin: 0;">New Newsletter Subscriber</h2>
          </div>
          <div style="padding: 25px;">
            <p><strong>Name:</strong> ${subscriberName || 'N/A'}</p>
            <p><strong>Email:</strong> ${subscriberEmail}</p>
            <p><strong>Source:</strong> ${source}</p>
            <p><strong>Traffic Source:</strong> ${trafficSource}</p>
          </div>
        </div>
      </body>
    </html>
  `;
  return sendEmail({ to: adminEmail, subject, html, text: subject, type: 'newsletter_subscriber' });
}

export async function sendNewUserRegistrationAdminEmail({ userName, userEmail, role, provider, homeRegion, rigType }) {
  const adminEmail = 'aalbadi1911@gmail.com';
  const subject = `🎉 [New Member Joined] ${userName} (${role}) via ${provider}`;
  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: -apple-system, sans-serif; background-color: #F8F9FA; padding: 25px 15px; color: #1E293B;">
        <div style="max-width: 550px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #10B981, #059669); padding: 30px 24px; text-align: center; color: #ffffff;">
            <h2 style="margin: 0;">New Member Registration</h2>
          </div>
          <div style="padding: 25px;">
            <p><strong>Name:</strong> ${userName}</p>
            <p><strong>Email:</strong> ${userEmail}</p>
            <p><strong>Role:</strong> ${role}</p>
            <p><strong>Provider:</strong> ${provider}</p>
            <p><strong>Home Region:</strong> ${homeRegion || 'N/A'}</p>
            <p><strong>Rig Type:</strong> ${rigType || 'N/A'}</p>
          </div>
        </div>
      </body>
    </html>
  `;
  return sendEmail({ to: adminEmail, subject, html, text: subject, type: 'new_user' });
}

export async function sendCommunityPostAdminEmail({ authorName, title, category, content }) {
  const adminEmail = 'aalbadi1911@gmail.com';
  const subject = `💬 [New Community Post] "${title}" by ${authorName}`;
  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: -apple-system, sans-serif; background-color: #F8F9FA; padding: 25px 15px; color: #1E293B;">
        <div style="max-width: 550px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #10B981, #059669); padding: 30px 24px; text-align: center; color: #ffffff;">
            <h2 style="margin: 0;">New Community Post</h2>
          </div>
          <div style="padding: 25px;">
            <p><strong>Author:</strong> ${authorName}</p>
            <p><strong>Title:</strong> ${title}</p>
            <p><strong>Category:</strong> ${category}</p>
            <p><strong>Content:</strong> ${content}</p>
          </div>
        </div>
      </body>
    </html>
  `;
  return sendEmail({ to: adminEmail, subject, html, text: subject, type: 'community_post' });
}

export async function sendDirectMessageAdminEmail({ senderName, senderEmail, recipientName, messageText, spotTitle }) {
  const adminEmail = 'aalbadi1911@gmail.com';
  const displaySpot = spotTitle || 'Direct Message';
  const subject = `✉️ [New Message] ${senderName} → ${recipientName} re: ${displaySpot}`;
  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: -apple-system, sans-serif; background-color: #F8F9FA; padding: 25px 15px; color: #1E293B;">
        <div style="max-width: 550px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #10B981, #059669); padding: 30px 24px; text-align: center; color: #ffffff;">
            <h2 style="margin: 0;">New Direct Message</h2>
          </div>
          <div style="padding: 25px;">
            <p><strong>From:</strong> ${senderName} (${senderEmail})</p>
            <p><strong>To:</strong> ${recipientName}</p>
            <p><strong>Regarding:</strong> ${displaySpot}</p>
            <p><strong>Message:</strong></p>
            <blockquote style="border-left: 4px solid #E2E8F0; padding-left: 15px; color: #475569;">${messageText}</blockquote>
          </div>
        </div>
      </body>
    </html>
  `;
  return sendEmail({ to: adminEmail, subject, html, text: subject, type: 'direct_message' });
}

/**
 * Forward general support & user inquiries to aalbadi1911@gmail.com
 */
export async function sendSupportInquiryAdminEmail({
  name = 'Traveler',
  email,
  topic = 'General Support',
  subject = 'Support Inquiry',
  message = '',
}) {
  const adminEmail = 'aalbadi1911@gmail.com';
  const mailSubject = `📬 [Support & Inquiry] ${topic}: "${subject}" from ${name}`;
  const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(`Re: [CampRoo Support] ${subject}`)}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F8F9FA; padding: 25px 15px; color: #1E293B;">
        <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
          <div style="background: linear-gradient(135deg, #0284C7, #0369A1); padding: 30px 24px; text-align: center; color: #ffffff;">
            <div style="display:inline-block; background:rgba(255,255,255,0.2); padding:4px 12px; border-radius:999px; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.5px;">
              CampRoo Support Desk
            </div>
            <h2 style="margin: 10px 0 0; font-size: 22px;">New Support Inquiry Received</h2>
          </div>
          <div style="padding: 25px; line-height: 1.6;">
            <p><strong>From:</strong> ${name} &lt;<a href="${mailtoUrl}" style="color:#0284C7;">${email}</a>&gt;</p>
            <p><strong>Topic:</strong> <span style="background:#E0F2FE; color:#0369A1; padding:3px 8px; border-radius:6px; font-weight:bold; font-size:12px;">${topic}</span></p>
            <p><strong>Subject:</strong> ${subject}</p>
            <div style="margin: 15px 0; padding: 15px; background: #F8FAFC; border-radius: 10px; border-left: 4px solid #0284C7;">
              <p style="margin: 0; font-weight: 600; color: #475569; font-size: 11px; text-transform: uppercase;">Message Content:</p>
              <p style="margin: 8px 0 0; color: #0F172A; white-space: pre-wrap;">${message}</p>
            </div>
            <div style="text-align: center; margin-top: 25px;">
              <a href="${mailtoUrl}" style="display: inline-block; background: #0284C7; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 13px; padding: 12px 24px; border-radius: 10px;">
                ✉️ Reply directly to ${name} (${email})
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
  return sendEmail({
    to: adminEmail,
    subject: mailSubject,
    html,
    text: `Support Inquiry from ${name} (${email}) - Topic: ${topic} - Subject: ${subject}\n\nMessage:\n${message}`,
    type: 'support_inquiry'
  });
}

/**
 * Confirmation receipt to the user who submitted an inquiry
 */
export async function sendSupportInquiryConfirmationEmail({ to, name, subject }) {
  if (!to || !to.includes('@')) return { success: false };
  const mailSubject = `We received your inquiry: "${subject}" 🚐 [CampRoo Support]`;
  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F8F9FA; padding: 25px 15px; color: #1E293B;">
        <div style="max-width: 550px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #E2E8F0; padding: 25px;">
          <h2 style="color: #0284C7; margin-top: 0;">Thanks for reaching out, ${name || 'Explorer'}!</h2>
          <p>We received your inquiry regarding <strong>"${subject}"</strong>.</p>
          <p>Our support team reviews incoming requests promptly. We'll reply directly to this email if any follow-up or assistance is needed.</p>
          <p style="margin-top: 25px; font-size: 12px; color: #64748B;">
            CampRoo Support · Safe Travels on the Open Road!
          </p>
        </div>
      </body>
    </html>
  `;
  return sendEmail({
    to,
    subject: mailSubject,
    html,
    text: `Hi ${name}, we received your inquiry regarding "${subject}". Our team will review it and reply directly.`,
    type: 'support_inquiry_receipt'
  });
}

/**
 * Forward Spot Edit / Correction requests to aalbadi1911@gmail.com
 */
export async function sendSpotEditRequestAdminEmail({
  spotId,
  spotTitle = 'RV Spot',
  submitterName = 'RVer Scout',
  submitterEmail = 'unknown@camproo.com',
  editType = 'road_access',
  suggestedChanges = {},
  notes = ''
}) {
  const adminEmail = 'aalbadi1911@gmail.com';
  const mailSubject = `🛠️ [Spot Edit Suggestion] "${spotTitle}" (${editType}) by ${submitterName}`;
  const mailtoUrl = `mailto:${submitterEmail}?subject=${encodeURIComponent(`CampRoo Spot Edit: ${spotTitle}`)}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F8F9FA; padding: 25px 15px; color: #1E293B;">
        <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #F59E0B, #D97706); padding: 25px 20px; text-align: center; color: #ffffff;">
            <div style="font-size: 11px; font-weight: 800; text-transform: uppercase;">CampRoo Spot Correction Desk</div>
            <h2 style="margin: 8px 0 0; font-size: 20px;">Spot Update Request</h2>
          </div>
          <div style="padding: 25px;">
            <p><strong>Spot:</strong> ${spotTitle} (ID: ${spotId})</p>
            <p><strong>Submitter:</strong> ${submitterName} (&lt;<a href="${mailtoUrl}">${submitterEmail}</a>&gt;)</p>
            <p><strong>Edit Category:</strong> ${editType}</p>
            <p><strong>Suggested Changes:</strong></p>
            <pre style="background: #F1F5F9; padding: 12px; border-radius: 8px; font-size: 12px; overflow-x: auto;">${JSON.stringify(suggestedChanges, null, 2)}</pre>
            <p><strong>Submitter Notes:</strong> ${notes || 'None'}</p>
            <div style="text-align: center; margin-top: 20px;">
              <a href="${mailtoUrl}" style="display: inline-block; background: #D97706; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 12px; padding: 10px 20px; border-radius: 8px;">
                Reply to Submitter (${submitterEmail})
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
  return sendEmail({
    to: adminEmail,
    subject: mailSubject,
    html,
    text: `Spot Edit Suggestion for "${spotTitle}" (${editType}) by ${submitterName} (${submitterEmail}). Notes: ${notes}`,
    type: 'spot_edit_request'
  });
}

/**
 * Forward New Spot Photo submissions to aalbadi1911@gmail.com
 */
export async function sendNewSpotPhotoAdminEmail({ spotId, spotTitle, uploaderName, photoUrl, caption }) {
  const adminEmail = 'aalbadi1911@gmail.com';
  const mailSubject = `📸 [New Spot Photo] For "${spotTitle || spotId}"`;
  const isDataUrl = photoUrl && photoUrl.startsWith('data:');
  const previewImg = isDataUrl
    ? '<p style="color:#64748B; font-style:italic;">(Base64 Photo attached in payload)</p>'
    : `<img src="${photoUrl}" alt="Spot photo" style="max-width: 100%; max-height: 300px; border-radius: 8px; border: 1px solid #E2E8F0; margin-top: 10px;" />`;

  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F8F9FA; padding: 25px 15px; color: #1E293B;">
        <div style="max-width: 550px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #10B981, #059669); padding: 25px; text-align: center; color: #ffffff;">
            <h2 style="margin: 0;">New Campsite Photo Uploaded</h2>
          </div>
          <div style="padding: 25px;">
            <p><strong>Spot:</strong> ${spotTitle || spotId}</p>
            ${uploaderName ? `<p><strong>Uploader:</strong> ${uploaderName}</p>` : ''}
            ${caption ? `<p><strong>Caption:</strong> ${caption}</p>` : ''}
            <div>${previewImg}</div>
          </div>
        </div>
      </body>
    </html>
  `;
  return sendEmail({
    to: adminEmail,
    subject: mailSubject,
    html,
    text: `New Photo uploaded for "${spotTitle || spotId}". Caption: ${caption || 'None'}`,
    type: 'spot_photo'
  });
}

/**
 * Forward Host Accept/Decline responses to aalbadi1911@gmail.com
 */
export async function sendStayResponseAdminEmail({ requestId, spotTitle, hostName, travelerName, status, note }) {
  const adminEmail = 'aalbadi1911@gmail.com';
  const mailSubject = `${status === 'accepted' ? '✅' : '❌'} [Stay Request ${status.toUpperCase()}] "${spotTitle || 'Spot'}" - ${hostName} responded`;
  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F8F9FA; padding: 25px 15px; color: #1E293B;">
        <div style="max-width: 550px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden;">
          <div style="background: linear-gradient(135deg, ${status === 'accepted' ? '#10B981, #059669' : '#64748B, #475569'}); padding: 25px; text-align: center; color: #ffffff;">
            <h2 style="margin: 0;">Stay Request ${status === 'accepted' ? 'Accepted' : 'Declined'}</h2>
          </div>
          <div style="padding: 25px;">
            <p><strong>Spot:</strong> ${spotTitle || 'RV Spot'} (Request ID: ${requestId})</p>
            <p><strong>Host:</strong> ${hostName}</p>
            <p><strong>Traveler:</strong> ${travelerName}</p>
            <p><strong>Decision:</strong> <strong style="color: ${status === 'accepted' ? '#059669' : '#DC2626'};">${status.toUpperCase()}</strong></p>
            <p><strong>Host Message:</strong></p>
            <blockquote style="border-left: 4px solid #E2E8F0; padding-left: 12px; color: #475569;">${note || 'No message attached.'}</blockquote>
          </div>
        </div>
      </body>
    </html>
  `;
  return sendEmail({
    to: adminEmail,
    subject: mailSubject,
    html,
    text: `Stay Request ${requestId} was ${status} by host ${hostName} for traveler ${travelerName}. Note: ${note}`,
    type: 'stay_response'
  });
}

/**
 * Forward New Community Discussion Comments to aalbadi1911@gmail.com
 */
export async function sendCommunityCommentAdminEmail({ postId, postTitle, authorName, commentText }) {
  const adminEmail = 'aalbadi1911@gmail.com';
  const mailSubject = `💬 [New Forum Reply] On "${postTitle || postId}" by ${authorName}`;
  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F8F9FA; padding: 25px 15px; color: #1E293B;">
        <div style="max-width: 550px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #10B981, #059669); padding: 25px; text-align: center; color: #ffffff;">
            <h2 style="margin: 0;">New Community Discussion Reply</h2>
          </div>
          <div style="padding: 25px;">
            <p><strong>Topic:</strong> ${postTitle || postId}</p>
            <p><strong>Reply From:</strong> ${authorName}</p>
            <p><strong>Comment:</strong></p>
            <blockquote style="border-left: 4px solid #E2E8F0; padding-left: 12px; color: #475569;">${commentText}</blockquote>
          </div>
        </div>
      </body>
    </html>
  `;
  return sendEmail({
    to: adminEmail,
    subject: mailSubject,
    html,
    text: `New Reply on "${postTitle || postId}" by ${authorName}: ${commentText}`,
    type: 'community_comment'
  });
}

