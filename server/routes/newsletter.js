import { Router } from "express";
import { db } from "../services/db.js";
import { requireAdminAuth } from "../services/adminAuth.js";
import { sendNewsletterSubscriberAdminEmail, sendNewsletterConfirmationEmail } from "../services/emailService.js";

export const newsletterRouter = Router();

// Public subscribe endpoint
newsletterRouter.post("/subscribe", async (req, res) => {
  const { email, name = "", source = "footer", trafficSource = "direct" } = req.body || {};
  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Valid email address is required" });
  }

  try {
    const { subscriber, isNew } = db.addSubscriber({
      email,
      name,
      source,
      trafficSource
    });

    if (isNew) {
      sendNewsletterSubscriberAdminEmail({
        subscriberEmail: email,
        subscriberName: name,
        source,
        trafficSource
      }).catch(err => console.error('[Email Error]', err));
      
      sendNewsletterConfirmationEmail({
        to: email,
        name
      }).catch(err => console.error('[Email Error]', err));
    }

    res.json({
      success: true,
      message: isNew ? "Subscribed to CampRoo weekly road digest!" : "Already subscribed!",
      isNew,
      subscriber
    });
  } catch (err) {
    console.error("[Newsletter Subscribe Error]", err);
    res.status(500).json({ success: false, error: "Failed to save subscriber" });
  }
});

// Admin-only: list subscribers
newsletterRouter.get("/subscribers", requireAdminAuth, (req, res) => {
  try {
    const subscribers = db.getSubscribers();
    res.json({
      success: true,
      count: subscribers.length,
      subscribers
    });
  } catch (err) {
    console.error("[Newsletter List Error]", err);
    res.status(500).json({ success: false, error: "Failed to fetch subscribers" });
  }
});

newsletterRouter.get("/", requireAdminAuth, (req, res) => {
  const subscribers = db.getSubscribers();
  res.json({
    success: true,
    count: subscribers.length,
    subscribers
  });
});