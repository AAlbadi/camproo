import { Router } from "express";
import { db } from "../db.js";
import {
  sendStayRequestAdminEmail,
  sendStayRequestHostEmail,
  sendStayRequestTravelerConfirmationEmail,
  sendStayResponseAdminEmail,
} from "../services/emailService.js";

export const requestsRouter = Router();

// GET requests (supports userId, travelerId, hostId)
requestsRouter.get("/", (req, res) => {
  const { travelerId, hostId, userId } = req.query;
  const requests = db.getRequests({ travelerId, hostId, userId });
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
    const host = spot?.hostId ? db.getUserById(spot.hostId) : (req.body.hostId ? db.getUserById(req.body.hostId) : null);

    const travelerName = req.body.travelerName || traveler?.name || 'Traveler';
    const travelerEmail = req.body.travelerEmail || traveler?.email || 'Unknown';
    const spotTitle = req.body.spotTitle || spot?.title || 'Unknown Spot';
    const spotLocation = req.body.spotLocation || [spot?.locationName, spot?.generalArea].filter(Boolean).join(', ') || 'USA';
    const arrivalDate = req.body.arrivalDate || 'Unknown';
    const departureDate = req.body.departureDate || 'Unknown';
    const nights = req.body.nights || 1;
    const rigDescription = req.body.rigDescription || (req.body.travelerRig ? `${req.body.travelerRig.lengthFt || 25}ft ${req.body.travelerRig.description || req.body.travelerRig.type || 'RV'}` : 'N/A');
    const personalNote = req.body.personalNote || 'N/A';

    let emailSent = false;
    try {
      // 1. Send stay request notification to Admin (Aziz)
      const adminResult = await sendStayRequestAdminEmail({
        travelerName,
        travelerEmail,
        spotTitle,
        spotLocation,
        arrivalDate,
        departureDate,
        nights,
        rigDescription,
        personalNote,
      });
      if (adminResult?.success) emailSent = true;

      // 2. If host has a registered email and is different from admin, notify host
      const hostEmail = host?.email || spot?.contactEmail;
      const adminEmail = process.env.ADMIN_EMAIL || 'aalbadi1911@gmail.com';
      if (hostEmail && hostEmail.includes('@') && hostEmail !== adminEmail) {
        sendStayRequestHostEmail({
          to: hostEmail,
          hostName: host?.name || 'Host',
          travelerName,
          travelerEmail,
          spotTitle,
          spotLocation,
          arrivalDate,
          departureDate,
          nights,
          rigDescription,
          personalNote,
        }).catch(err => console.error('[Host Email Error]', err));
      }

      // 3. Send confirmation receipt to traveler
      if (travelerEmail && travelerEmail.includes('@') && travelerEmail !== 'Unknown') {
        sendStayRequestTravelerConfirmationEmail({
          to: travelerEmail,
          travelerName,
          spotTitle,
          spotLocation,
          arrivalDate,
          departureDate,
          nights,
        }).catch(err => console.error('[Traveler Receipt Error]', err));
      }
    } catch (mailErr) {
      console.error('[CampRoo] Failed to dispatch stay request emails:', mailErr);
    }

    res.status(201).json({ success: true, data: newReq, emailSent });
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

// DELETE request by ID
requestsRouter.delete("/:id", (req, res) => {
  const deleted = db.deleteRequest(req.params.id);
  if (!deleted) return res.status(404).json({ success: false, message: "Request not found" });
  res.json({ success: true, message: "Request deleted successfully" });
});

