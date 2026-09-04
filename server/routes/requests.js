import { Router } from "express";
import { db } from "../db.js";

export const requestsRouter = Router();

// GET requests
requestsRouter.get("/", (req, res) => {
  const { travelerId, hostId } = req.query;
  const requests = db.getRequests({ travelerId, hostId });
  res.json({ success: true, data: requests });
});

// GET request by ID
requestsRouter.get("/:id", (req, res) => {
  const reqItem = db.getRequestById(req.params.id);
  if (!reqItem) return res.status(404).json({ success: false, message: "Request not found" });
  res.json({ success: true, data: reqItem });
});

// POST create request
requestsRouter.post("/", (req, res) => {
  try {
    const newReq = db.addRequest(req.body);
    res.status(201).json({ success: true, data: newReq });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH update request status
requestsRouter.patch("/:id", (req, res) => {
  const updated = db.updateRequest(req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, message: "Request not found" });
  res.json({ success: true, data: updated });
});
