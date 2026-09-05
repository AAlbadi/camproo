import { Router } from "express";
import { db } from "../db.js";
import { sendDirectMessageAdminEmail } from "../services/emailService.js";

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
threadsRouter.post("/", async (req, res) => {
  try {
    const newThread = db.addThread(req.body);
    
    sendDirectMessageAdminEmail({
      senderName: newThread.travelerName || req.body.travelerName || 'Sender',
      senderEmail: req.body.travelerEmail || 'unknown@example.com',
      recipientName: newThread.hostName || req.body.hostName || 'Recipient',
      messageText: req.body.initialMessage || req.body.messages?.[0]?.text || 'Started a new thread',
      spotTitle: newThread.spotTitle || req.body.spotTitle || 'Direct Message'
    }).catch(err => console.error('[Email Error]', err));

    res.status(201).json({ success: true, data: newThread });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST send message in thread
threadsRouter.post("/:id/messages", async (req, res) => {
  const msg = db.addMessageToThread(req.params.id, req.body);
  if (!msg) return res.status(404).json({ success: false, message: "Thread not found" });

  const thread = db.getThreadById(req.params.id);
  
  sendDirectMessageAdminEmail({
    senderName: req.body.senderName || req.body.senderId || 'Sender',
    senderEmail: req.body.senderEmail || 'unknown@example.com',
    recipientName: 'Recipient',
    messageText: req.body.text || 'N/A',
    spotTitle: thread ? thread.spotTitle : 'Direct Message'
  }).catch(err => console.error('[Email Error]', err));

  res.status(201).json({ success: true, data: msg });
});

// PATCH mark thread read
threadsRouter.patch("/:id/read", (req, res) => {
  const { userId } = req.body;
  const ok = db.markThreadRead(req.params.id, userId);
  res.json({ success: ok });
});
