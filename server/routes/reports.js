import { Router } from "express";
import { db } from "../db.js";
import { sendSafetyReportAdminEmail } from "../services/emailService.js";

export const reportsRouter = Router();

// GET reports
reportsRouter.get("/", (req, res) => {
  const reports = db.getReports();
  res.json({ success: true, data: reports });
});

// POST file report
reportsRouter.post("/", async (req, res) => {
  try {
    const report = db.addReport(req.body);

    const reporter = req.body.reporterId ? db.getUserById(req.body.reporterId) : null;
    const targetType = req.body.targetType || req.body.reportedTargetType || 'Unknown';
    const reporterName = req.body.reporterName || reporter?.name || 'Anonymous';
    const reporterEmail = req.body.reporterEmail || reporter?.email || '';

    sendSafetyReportAdminEmail({
      reporterName,
      reporterEmail,
      targetType,
      targetName: req.body.targetName || 'Unknown',
      reason: req.body.reason || 'Unknown',
      details: req.body.details || 'N/A'
    }).catch(err => console.error('[Email Error]', err));

    res.status(201).json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH update report status
reportsRouter.patch("/:id", (req, res) => {
  const updated = db.updateReport(req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, message: "Report not found" });
  res.json({ success: true, data: updated });
});
