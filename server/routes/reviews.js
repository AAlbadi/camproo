import { Router } from "express";
import { db } from "../db.js";

export const reviewsRouter = Router();

// GET reviews
reviewsRouter.get("/", (req, res) => {
  const { spotId } = req.query;
  const reviews = db.getReviews(spotId);
  res.json({ success: true, data: reviews });
});

// POST add review
reviewsRouter.post("/", (req, res) => {
  try {
    const newReview = db.addReview(req.body);
    res.status(201).json({ success: true, data: newReview });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
