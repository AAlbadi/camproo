import { Router } from "express";
import { db } from "../db.js";
import {
  sendSpotSubmissionReviewEmail,
  sendSpotSubmitterConfirmationEmail,
  sendSpotEditRequestAdminEmail,
  sendNewSpotPhotoAdminEmail
} from "../services/emailService.js";

export const spotsRouter = Router();

// POST submit spot with review email dispatch to admin
spotsRouter.post("/submit", async (req, res) => {
  try {
    const {
      spot,
      submitterName = "CampRoo Member",
      submitterEmail = "",
      submitterPhone = "",
      visibility = "public",
      notes = ""
    } = req.body;

    if (!spot) {
      return res.status(400).json({ success: false, message: "Missing spot payload" });
    }

    const effectiveEmail = submitterEmail || spot.contactEmail || "unknown@camproo.com";

    // Assign spot id if not present
    const spotToSave = {
      ...spot,
      id: spot.id || `spot-${Date.now()}`,
      visibility: visibility || "public",
      reviewStatus: visibility === "personal" ? "personal" : "pending_review",
      submitterName,
      contactEmail: effectiveEmail,
      contactPhone: submitterPhone,
      createdAt: spot.createdAt || new Date().toISOString().split("T")[0],
      status: spot.status || "active",
    };

    // Save in memory / database
    const savedSpot = db.addSpot(spotToSave);

    // Send email notification to owner (aalbadi1911@gmail.com)
    let emailResult = { success: false };
    try {
      emailResult = await sendSpotSubmissionReviewEmail({
        spot: savedSpot,
        submitterName,
        submitterEmail: effectiveEmail,
        submitterPhone,
        visibility,
        notes
      });
    } catch (mailErr) {
      console.error("[CampRoo] Failed to send spot review email:", mailErr);
    }

    // Send confirmation receipt to submitter if distinct email provided
    if (effectiveEmail && effectiveEmail !== "aalbadi1911@gmail.com" && effectiveEmail.includes("@")) {
      sendSpotSubmitterConfirmationEmail({
        to: effectiveEmail,
        name: submitterName,
        spotTitle: savedSpot.title
      }).catch(() => {});
    }

    res.status(201).json({
      success: true,
      data: savedSpot,
      emailSent: Boolean(emailResult?.success),
      message: visibility === "personal"
        ? "Personal spot saved successfully to your private map."
        : "Spot submitted successfully! Details sent to our verification team for review."
    });
  } catch (err) {
    console.error("[CampRoo] Error submitting spot:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET saved spots for a user
spotsRouter.get("/saved/:userId", (req, res) => {
  try {
    const savedSpotIds = db.getSavedSpots(req.params.userId);
    res.json({ success: true, savedSpotIds });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST save/like a spot
spotsRouter.post("/save", (req, res) => {
  try {
    const { userId, spotId } = req.body;
    if (!userId || !spotId) {
      return res.status(400).json({ success: false, message: "userId and spotId required" });
    }
    const savedSpotIds = db.saveSpot(userId, spotId);
    res.json({ success: true, savedSpotIds });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST unsave/unlike a spot
spotsRouter.post("/unsave", (req, res) => {
  try {
    const { userId, spotId } = req.body;
    if (!userId || !spotId) {
      return res.status(400).json({ success: false, message: "userId and spotId required" });
    }
    const savedSpotIds = db.unsaveSpot(userId, spotId);
    res.json({ success: true, savedSpotIds });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

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

// POST /api/spots/:id/photos - Upload community photo for a spot
spotsRouter.post("/:id/photos", async (req, res) => {
  const { id } = req.params;
  const { photoUrl, imageBase64, filename, caption } = req.body;

  let finalUrl = photoUrl;

  // If user uploaded an image via Base64, upload to Supabase Storage
  if (imageBase64 && !finalUrl) {
    try {
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://tkyfoexwvbbblccfwyej.supabase.co";

      if (serviceKey && supabaseUrl) {
        const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");
        const buffer = Buffer.from(cleanBase64, "base64");
        const safeName = `${id}-${Date.now()}-${(filename || "photo.jpg").replace(/[^a-zA-Z0-9.-]/g, "_")}`;

        const uploadUrl = `${supabaseUrl}/storage/v1/object/spot-photos/${safeName}`;
        const uploadResp = await fetch(uploadUrl, {
          method: "POST",
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            "Content-Type": "image/jpeg",
          },
          body: buffer,
        });

        if (uploadResp.ok) {
          finalUrl = `${supabaseUrl}/storage/v1/object/public/spot-photos/${safeName}`;
        }
      }
    } catch (uploadErr) {
      console.error("[CampRoo API] Failed to upload photo to Supabase storage:", uploadErr);
    }

    if (!finalUrl && imageBase64) {
      finalUrl = imageBase64;
    }
  }

  if (!finalUrl) {
    return res.status(400).json({ success: false, message: "No photo provided" });
  }

  // Update Supabase database if available
  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://tkyfoexwvbbblccfwyej.supabase.co";
    if (serviceKey && supabaseUrl) {
      const fetchResp = await fetch(`${supabaseUrl}/rest/v1/spots?id=eq.${id}&select=photos`, {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      });
      if (fetchResp.ok) {
        const rows = await fetchResp.json();
        if (rows && rows.length > 0) {
          const currentPhotos = rows[0].photos || [];
          const updatedPhotos = [finalUrl, ...currentPhotos];
          await fetch(`${supabaseUrl}/rest/v1/spots?id=eq.${id}`, {
            method: "PATCH",
            headers: {
              apikey: serviceKey,
              Authorization: `Bearer ${serviceKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ photos: updatedPhotos }),
          });
        }
      }
    }
  } catch (dbErr) {
    console.warn("[CampRoo API] Could not patch photos in Supabase DB:", dbErr.message);
  }

  // Look up spot title for rich email notification
  const targetSpot = db.getSpotById(id);
  sendNewSpotPhotoAdminEmail({
    spotId: id,
    spotTitle: targetSpot?.title || id,
    uploaderName: req.body.uploaderName || 'CampRoo Scout',
    photoUrl: finalUrl,
    caption: caption || ''
  }).catch(err => console.error('[Photo Email Error]', err));

  res.json({
    success: true,
    photoUrl: finalUrl,
    caption: caption || "",
  });
});

// PATCH /api/spots/:id/approve - Approve pending spot
spotsRouter.patch("/:id/approve", (req, res) => {
  try {
    const spot = db.getSpotById(req.params.id);
    if (!spot) return res.status(404).json({ success: false, message: "Spot not found" });
    const updated = db.updateSpot(req.params.id, { reviewStatus: 'approved', status: 'active' });
    res.json({ success: true, data: updated, message: "Spot approved successfully." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/spots/edits/all - List all spot edit requests
spotsRouter.get("/edits/all", (req, res) => {
  try {
    const edits = db.getSpotEditRequests();
    res.json({ success: true, data: edits });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/spots/:id/edit-requests - Submit community spot edit suggestion
spotsRouter.post("/:id/edit-requests", async (req, res) => {
  try {
    const { id } = req.params;
    const editData = req.body || {};
    const targetSpot = db.getSpotById(id);

    const savedRequest = db.addSpotEditRequest({
      spotId: id,
      spotTitle: editData.spotTitle || targetSpot?.title || id,
      ...editData
    });

    sendSpotEditRequestAdminEmail({
      spotId: id,
      spotTitle: editData.spotTitle || targetSpot?.title || id,
      submitterName: editData.submitterName || 'CampRoo Scout',
      submitterEmail: editData.submitterEmail || 'unknown@camproo.com',
      editType: editData.editType || 'road_access',
      suggestedChanges: editData.suggestedChanges || {},
      notes: editData.notes || ''
    }).catch(err => console.error('[Spot Edit Email Error]', err));

    res.status(201).json({
      success: true,
      message: "Edit request logged successfully for ranger review.",
      data: savedRequest,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/spots/edits/:editId/approve - Approve and apply edit request
spotsRouter.patch("/edits/:editId/approve", (req, res) => {
  try {
    const { editId } = req.params;
    const edits = db.getSpotEditRequests();
    const reqItem = edits.find(e => e.id === editId);
    if (!reqItem) return res.status(404).json({ success: false, message: "Edit request not found" });

    // Apply suggested changes to spot if spot exists
    const spot = db.getSpotById(reqItem.spotId);
    if (spot && reqItem.suggestedChanges) {
      const changes = reqItem.suggestedChanges;
      const spotUpdates = {};
      if (changes.maxLengthFt) {
        spotUpdates.rigCompatibility = {
          ...spot.rigCompatibility,
          maxLengthFt: changes.maxLengthFt
        };
      }
      if (changes.coordinates && Array.isArray(changes.coordinates)) {
        spotUpdates.coordinates = changes.coordinates;
      }
      if (changes.roadCondition) {
        spotUpdates.description = `${spot.description}\n\n[Road Condition Update]: ${changes.roadCondition}`;
      }
      if (changes.seasonalNotes) {
        spotUpdates.description = `${spot.description}\n\n[Seasonal Notice]: ${changes.seasonalNotes}`;
      }
      if (changes.title) spotUpdates.title = changes.title;
      if (changes.description) spotUpdates.description = changes.description;

      db.updateSpot(spot.id, spotUpdates);
    }

    const updatedReq = db.updateSpotEditRequest(editId, { status: 'applied', appliedAt: new Date().toISOString() });
    res.json({ success: true, data: updatedReq, message: "Edit request approved and applied." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/spots/edits/:editId/reject - Reject edit request
spotsRouter.patch("/edits/:editId/reject", (req, res) => {
  try {
    const { editId } = req.params;
    const updatedReq = db.updateSpotEditRequest(editId, { status: 'rejected', rejectedAt: new Date().toISOString() });
    if (!updatedReq) return res.status(404).json({ success: false, message: "Edit request not found" });
    res.json({ success: true, data: updatedReq, message: "Edit request rejected." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


