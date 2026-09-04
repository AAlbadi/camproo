import { Router } from "express";
import { db } from "../db.js";

export const spotsRouter = Router();

// GET all spots with query filters
spotsRouter.get("/", (req, res) => {
  const filters = {
    search: req.query.search,
    environment: req.query.environment,
    minLength: req.query.minLength,
    electricity: req.query.electricity,
    water: req.query.water,
    pets: req.query.pets,
  };
  const spots = db.getSpots(filters);
  res.json({ success: true, count: spots.length, data: spots });
});

// GET spot by ID
spotsRouter.get("/:id", (req, res) => {
  const spot = db.getSpotById(req.params.id);
  if (!spot) return res.status(404).json({ success: false, message: "Spot not found" });
  res.json({ success: true, data: spot });
});

// POST create new spot
spotsRouter.post("/", (req, res) => {
  try {
    const newSpot = db.addSpot(req.body);
    res.status(201).json({ success: true, data: newSpot });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update spot
spotsRouter.put("/:id", (req, res) => {
  const updated = db.updateSpot(req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, message: "Spot not found" });
  res.json({ success: true, data: updated });
});

// DELETE spot
spotsRouter.delete("/:id", (req, res) => {
  const deleted = db.deleteSpot(req.params.id);
  if (!deleted) return res.status(404).json({ success: false, message: "Spot not found" });
  res.json({ success: true, message: "Spot deleted successfully" });
});
