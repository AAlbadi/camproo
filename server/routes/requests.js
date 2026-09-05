import { Router } from "express";
import { db } from "../db.js";
import { sendStayRequestAdminEmail, sendStayResponseAdminEmail } from "../services/emailService.js";

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
requestsRouter.post("/", async (req, res) => {
  try {
    const newReq = db.addRequest(req.body);

    const traveler = req.body.travelerId ? db.getUserById(req.body.travelerId) : null;
    const spot = req.body.spotId ? db.getSpotById(req.body.spotId) : null;

    sendStayRequestAdminEmail({
      travelerName: req.body.travelerName || traveler?.name || 'Traveler',
      travelerEmail: req.body.travelerEmail || traveler?.email || 'Unknown',
      spotTitle: req.body.spotTitle || spot?.title || 'Unknown Spot',
      spotLocation: req.body.spotLocation || [spot?.locationName, spot?.generalArea].filter(Boolean).join(', ') || 'USA',
      arrivalDate: req.body.arrivalDate || 'Unknown',
      departureDate: req.body.departureDate || 'Unknown',
      nights: req.body.nights || 1,
      rigDescription: req.body.rigDescription || (req.body.travelerRig ? `${req.body.travelerRig.lengthFt || 25}ft ${req.body.travelerRig.description || req.body.travelerRig.type || 'RV'}` : 'N/A'),
      personalNote: req.body.personalNote || 'N/A'
    }).catch(err => console.error('[Email Error]', err));

    res.status(201).json({ success: true, data: newReq });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH update request status
requestsRouter.patch("/:id", (req, res) => {
  const updated = db.updateRequest(req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, message: "Request not found" });

  if (req.body.status && (req.body.status === 'accepted' || req.body.status === 'declined')) {
    const spot = updated.spotId ? db.getSpotById(updated.spotId) : null;
    const host = updated.hostId ? db.getUserById(updated.hostId) : null;
    const traveler = updated.travelerId ? db.getUserById(updated.travelerId) : null;
    sendStayResponseAdminEmail({
      requestId: updated.id,
      spotTitle: spot?.title || updated.spotTitle || 'RV Spot',
      hostName: host?.name || 'Host',
      travelerName: traveler?.name || updated.travelerName || 'Traveler',
      status: req.body.status,
      note: req.body.hostResponseNote || ''
    }).catch(err => console.error('[Stay Response Email Error]', err));
  }

  res.json({ success: true, data: updated });
});
