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
  if (SENDGRID_API_KEY && !SENDGRID_API_KEY.includes('your_')) {
    try {
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SENDGRID_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: EMAIL_FROM.replace(/.*<(.+)>/, '$1') || 'hello@camproo.com', name: 'CampRoo Community' },
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
