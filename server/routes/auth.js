import { Router } from "express";
import { db } from "../db.js";
import { db as serviceDb } from "../services/db.js";
import { ADMIN_CREDENTIALS, ADMIN_USER_PROFILE, validateAdminLogin } from "../services/adminAuth.js";
import { sendNewUserRegistrationAdminEmail, sendWelcomeEmail } from "../services/emailService.js";

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

// POST Admin Login - strictly verifies admin aziz credentials
authRouter.post("/admin-login", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ success: false, error: "Username and password required" });
  }

  if (validateAdminLogin(username, password)) {
    return res.json({
      success: true,
      message: "Admin authentication successful. Welcome Aziz.",
      token: ADMIN_CREDENTIALS.token,
      user: ADMIN_USER_PROFILE
    });
  }

  return res.status(401).json({
    success: false,
    error: "Invalid admin credentials. Access restricted to admin aziz."
  });
});

// POST Standard Login (email or username + password)
authRouter.post("/login", (req, res) => {
  const { identifier, password } = req.body || {};
  if (!identifier || !password) {
    return res.status(400).json({ success: false, error: "Identifier and password required" });
  }

  // Check if admin credentials
  if (validateAdminLogin(identifier, password)) {
    return res.json({
      success: true,
      isAdmin: true,
      token: ADMIN_CREDENTIALS.token,
      user: ADMIN_USER_PROFILE
    });
  }

  // Check existing users by email or name
  const cleanId = identifier.trim().toLowerCase();
  const allUsers = db.getUsers();
  const foundUser = allUsers.find(
    u => (u.email && u.email.toLowerCase() === cleanId) || 
         (u.name && u.name.toLowerCase() === cleanId)
  );

  if (foundUser) {
    return res.json({
      success: true,
      isAdmin: foundUser.role === "admin",
      user: foundUser
    });
  }

  return res.status(401).json({
    success: false,
    error: "No account found with this email or username. Please check your spelling or create an account."
  });
});

// POST Social Sign In (Google / Apple)
authRouter.post("/social/:provider", async (req, res) => {
  const { provider } = req.params;
  const { email, name, avatar, newsletterOptIn, trafficAttribution } = req.body || {};

  const allUsers = db.getUsers();
  let user;

  if (email) {
    user = allUsers.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
  }

  if (!user) {
    const providerCapitalized = provider.charAt(0).toUpperCase() + provider.slice(1);
    const userName = name || `${providerCapitalized} Roamer`;
    const userEmail = email || `${provider.toLowerCase()}_user_${Date.now()}@camproo.com`;
    user = db.addUser({
      name: userName,
      role: "traveler",
      email: userEmail,
      phone: "+1 (555) 019-2834",
      avatar: avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=0284c7&color=fff&bold=true`,
      bio: "Highway roamer exploring scenic spots and public lands across America.",
      homeRegion: "United States",
      yearsRVing: 1,
      rig: {
        type: "class_c",
        makeModel: "Adventure Rig",
        lengthFt: 25,
        year: 2024
      },
      tripsCompleted: 0,
      spotsHosted: 0,
      joinedYear: new Date().getFullYear(),
      rating: 5.0,
      reviewCount: 0,
      verifications: { email: true, phone: false, idDocument: false, rvOwnership: true }
    });

    sendNewUserRegistrationAdminEmail({
      userName: user.name || 'Anonymous',
      userEmail: user.email || 'N/A',
      role: user.role || 'traveler',
      provider: provider,
      homeRegion: user.homeRegion,
      rigType: user.rig?.type || 'N/A'
    }).catch(err => console.error('[Email Error]', err));

    sendWelcomeEmail({
      to: user.email,
      name: user.name,
      newsletterOptIn: newsletterOptIn || false
    }).catch(err => console.error('[Email Error]', err));
  }

  // Record newsletter opt-in if requested
  if (newsletterOptIn && user?.email) {
    try {
      serviceDb.addSubscriber({
        email: user.email,
        name: user.name,
        source: `social_${provider}`,
        trafficSource: trafficAttribution?.source || "direct"
      });
    } catch (e) {}
  }

  res.json({
    success: true,
    provider,
    user
  });
});

// POST register user
authRouter.post("/register", async (req, res) => {
  try {
    const newUser = db.addUser(req.body);
    // Also save to serviceDb for persistent subscribers if opted in
    if (req.body.newsletterOptIn && req.body.email) {
      try {
        serviceDb.addSubscriber({
          email: req.body.email,
          name: req.body.name || "",
          source: "signup_form",
          trafficSource: req.body.trafficAttribution?.source || "direct"
        });
      } catch (e) {}
    }

    sendNewUserRegistrationAdminEmail({
      userName: newUser.name || 'Anonymous',
      userEmail: newUser.email || 'N/A',
      role: newUser.role || 'traveler',
      provider: 'email',
      homeRegion: newUser.homeRegion,
      rigType: newUser.rig?.type || 'N/A'
    }).catch(err => console.error('[Email Error]', err));

    if (newUser.email) {
      sendWelcomeEmail({
        to: newUser.email,
        name: newUser.name,
        newsletterOptIn: req.body.newsletterOptIn || false
      }).catch(err => console.error('[Email Error]', err));
    }

    res.status(201).json({ success: true, user: newUser, data: newUser });
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
