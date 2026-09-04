import { Router } from "express";
import { db } from "../db.js";

export const reportsRouter = Router();

// GET reports
reportsRouter.get("/", (req, res) => {
  const reports = db.getReports();
  res.json({ success: true, data: reports });
});

// POST file report
reportsRouter.post("/", (req, res) => {
  try {
    const report = db.addReport(req.body);
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
