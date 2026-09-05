import { Router } from "express";
import { db } from "../services/db.js";
import {
  sendSupportInquiryAdminEmail,
  sendSupportInquiryConfirmationEmail
} from "../services/emailService.js";

export const supportRouter = Router();

/**
 * POST /api/support/inquiry
 * Forward incoming support and inquiry requests directly to aalbadi1911@gmail.com
 */
supportRouter.post("/inquiry", async (req, res) => {
  const {
    name = "Traveler / Host",
    email,
    topic = "General Support",
    subject = "Support Inquiry",
    message = ""
  } = req.body || {};

  if (!email || !email.includes("@")) {
    return res.status(400).json({ success: false, message: "A valid email address is required." });
  }

  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, message: "Please enter your message or inquiry." });
  }

  try {
    // Dispatch forward email to aalbadi1911@gmail.com
    const forwardResult = await sendSupportInquiryAdminEmail({
      name: name.trim() || "Traveler",
      email: email.trim(),
      topic,
      subject: subject.trim() || "Inquiry via CampRoo Support Desk",
      message: message.trim()
    });

    // Send confirmation receipt back to traveler/host
    sendSupportInquiryConfirmationEmail({
      to: email.trim(),
      name: name.trim(),
      subject: subject.trim() || "CampRoo Support Inquiry"
    }).catch(err => console.error("[Support Receipt Error]", err));

    res.status(201).json({
      success: true,
      message: "Your inquiry has been received and forwarded to CampRoo support. We will reply promptly!",
      emailSent: Boolean(forwardResult?.success),
      logId: forwardResult?.logId
    });
  } catch (err) {
    console.error("[Support Inquiry Error]", err);
    res.status(500).json({ success: false, message: "Failed to submit inquiry. Please try again or email us directly." });
  }
});
