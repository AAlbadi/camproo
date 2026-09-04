import { Router } from "express";
import { db } from "../db.js";

export const authRouter = Router();

// GET all users
authRouter.get("/users", (req, res) => {
  const users = db.getUsers();
  res.json({ success: true, data: users });
});

// GET single user
authRouter.get("/users/:id", (req, res) => {
  const user = db.getUserById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  res.json({ success: true, data: user });
});

// POST register user
authRouter.post("/register", (req, res) => {
  try {
    const newUser = db.addUser(req.body);
    res.status(201).json({ success: true, data: newUser });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update user profile
authRouter.put("/users/:id", (req, res) => {
  const updated = db.updateUser(req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, message: "User not found" });
  res.json({ success: true, data: updated });
});
