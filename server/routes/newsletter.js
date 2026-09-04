import { Router } from "express";

export const newsletterRouter = Router();

let subscribers = [];

newsletterRouter.post("/subscribe", (req, res) => {
  const { email, name = "" } = req.body;
  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Valid email address is required" });
  }
  const existing = subscribers.find(s => s.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.json({ success: true, message: "Already subscribed!", isNew: false });
  }
  const subscriber = {
    id: `sub-${Date.now()}`,
    email,
    name,
    subscribedAt: new Date().toISOString(),
  };
  subscribers.push(subscriber);
  res.json({ success: true, message: "Subscribed to CampRoo newsletter!", isNew: true });
});

newsletterRouter.get("/", (req, res) => {
  res.json({ count: subscribers.length, subscribers });
});

newsletterRouter.get("/subscribers", (req, res) => {
  res.json({ count: subscribers.length, subscribers });
});