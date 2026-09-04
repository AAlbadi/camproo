import { Router } from "express";

export const healthRouter = Router();

healthRouter.get("/", (req, res) => {
  res.json({
    status: "ok",
    app: "CampRoo API",
    tagline: "Find a spot. Share a spot. Keep roaming.",
    localization: "United States (US standards)",
    currency: "USD ($0 free community)",
    timestamp: new Date().toISOString(),
    zeroSetupRequired: true,
  });
});
