import { Router } from "express";

export const analyticsRouter = Router();

let events = [];

analyticsRouter.post("/track", (req, res) => {
  const event = {
    id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    ...req.body,
  };
  events.push(event);
  if (events.length > 500) events.shift();
  res.json({ success: true, eventId: event.id });
});

analyticsRouter.get("/stats", (req, res) => {
  res.json({
    totalViews: events.length,
    recentEvents: events.slice(-10),
  });
});