import { Router } from "express";
import { db } from "../services/db.js";
import { requireAdminAuth } from "../services/adminAuth.js";

export const vsotdRouter = Router();

/**
 * GET /api/vsotd
 * Get current Vehicle & Spot Of The Day (VSOTD)
 */
vsotdRouter.get("/", (req, res) => {
  try {
    const vsotd = db.getVsotd();
    res.json({ success: true, vsotd });
  } catch (err) {
    console.error("[VSOTD GET Error]", err);
    res.status(500).json({ success: false, error: "Failed to fetch VSOTD" });
  }
});

/**
 * POST /api/vsotd/register
 * Admin endpoint to set/update Vehicle & Spot Of The Day
 */
vsotdRouter.post("/register", requireAdminAuth, (req, res) => {
  try {
    const { spotId, title, locationName, highlightNote } = req.body;
    if (!spotId) {
      return res.status(400).json({ success: false, error: "spotId is required" });
    }

    const spot = db.getSpotById(spotId);
    const effectiveTitle = title || spot?.title || "Featured Haven";
    const effectiveLoc = locationName || spot?.locationName || "United States";

    const updatedVsotd = db.registerVsotd({
      spotId,
      title: effectiveTitle,
      locationName: effectiveLoc,
      highlightNote: highlightNote || "Featured Ranger Choice VSOTD."
    });

    res.json({
      success: true,
      vsotd: updatedVsotd,
      message: `VSOTD successfully updated to "${effectiveTitle}"`
    });
  } catch (err) {
    console.error("[VSOTD Register Error]", err);
    res.status(500).json({ success: false, error: "Failed to register VSOTD" });
  }
});

/**
 * POST /api/vsotd/track
 * Track click on VSOTD
 */
vsotdRouter.post("/track", (req, res) => {
  try {
    const vsotd = db.trackVsotdClick();
    res.json({ success: true, clicks: vsotd.clicks });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to track VSOTD click" });
  }
});
