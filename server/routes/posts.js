import { Router } from "express";
import { db } from "../db.js";

export const postsRouter = Router();

// GET community posts
postsRouter.get("/", (req, res) => {
  const { category } = req.query;
  const posts = db.getPosts(category);
  res.json({ success: true, data: posts });
});

// POST create post
postsRouter.post("/", (req, res) => {
  try {
    const newPost = db.addPost(req.body);
    res.status(201).json({ success: true, data: newPost });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST upvote post
postsRouter.post("/:id/upvote", (req, res) => {
  const { userId } = req.body;
  const post = db.upvotePost(req.params.id, userId);
  if (!post) return res.status(404).json({ success: false, message: "Post not found" });
  res.json({ success: true, data: post });
});

// POST comment on post
postsRouter.post("/:id/comments", (req, res) => {
  const comment = db.addCommentToPost(req.params.id, req.body);
  if (!comment) return res.status(404).json({ success: false, message: "Post not found" });
  res.status(201).json({ success: true, data: comment });
});
