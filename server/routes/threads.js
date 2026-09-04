import { Router } from "express";
import { db } from "../db.js";

export const threadsRouter = Router();

// GET threads for user
threadsRouter.get("/", (req, res) => {
  const { userId } = req.query;
  const threads = db.getThreads(userId);
  res.json({ success: true, data: threads });
});

// GET thread by ID
threadsRouter.get("/:id", (req, res) => {
  const thread = db.getThreadById(req.params.id);
  if (!thread) return res.status(404).json({ success: false, message: "Thread not found" });
  res.json({ success: true, data: thread });
});

// POST start new thread
threadsRouter.post("/", (req, res) => {
  try {
    const newThread = db.addThread(req.body);
    res.status(201).json({ success: true, data: newThread });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST send message in thread
threadsRouter.post("/:id/messages", (req, res) => {
  const msg = db.addMessageToThread(req.params.id, req.body);
  if (!msg) return res.status(404).json({ success: false, message: "Thread not found" });
  res.status(201).json({ success: true, data: msg });
});

// PATCH mark thread read
threadsRouter.patch("/:id/read", (req, res) => {
  const { userId } = req.body;
  const ok = db.markThreadRead(req.params.id, userId);
  res.json({ success: ok });
});
