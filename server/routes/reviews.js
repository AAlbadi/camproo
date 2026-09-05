import { Router } from "express";
import { db } from "../db.js";
import { sendNewReviewAdminEmail } from "../services/emailService.js";

export const reviewsRouter = Router();

// GET reviews
reviewsRouter.get("/", (req, res) => {
  const { spotId } = req.query;
  const reviews = db.getReviews(spotId);
  res.json({ success: true, data: reviews });
});

// POST add review
reviewsRouter.post("/", async (req, res) => {
  try {
    const newReview = db.addReview(req.body);

    const reviewer = (req.body.authorId || req.body.travelerId)
      ? db.getUserById(req.body.authorId || req.body.travelerId)
      : null;
    const spot = req.body.spotId ? db.getSpotById(req.body.spotId) : null;

    sendNewReviewAdminEmail({
      reviewerName: req.body.reviewerName || reviewer?.name || 'CampRoo Roamer',
      spotTitle: req.body.spotTitle || spot?.title || 'RV Spot',
      ratingOverall: req.body.ratingOverall || 0,
      categories: req.body.categories || {},
      wouldWelcomeAgain: req.body.wouldWelcomeAgain !== undefined ? req.body.wouldWelcomeAgain : true,
      comment: req.body.comment || 'N/A'
    }).catch(err => console.error('[Email Error]', err));

    res.status(201).json({ success: true, data: newReview });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update review
reviewsRouter.put("/:id", (req, res) => {
  try {
    const updated = db.updateReview(req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, message: "Review not found" });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH approve review
reviewsRouter.patch("/:id/approve", (req, res) => {
  try {
    const approved = db.approveReview(req.params.id);
    if (!approved) return res.status(404).json({ success: false, message: "Review not found" });
    res.json({ success: true, data: approved });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE review
reviewsRouter.delete("/:id", (req, res) => {
  try {
    const success = db.deleteReview(req.params.id);
    if (!success) return res.status(404).json({ success: false, message: "Review not found" });
    res.json({ success: true, message: "Review deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

