try { process.loadEnvFile(); } catch (e) {}
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { authRouter } from "./routes/auth.js";
import { spotsRouter } from "./routes/spots.js";
import { requestsRouter } from "./routes/requests.js";
import { threadsRouter } from "./routes/threads.js";
import { postsRouter } from "./routes/posts.js";
import { reviewsRouter } from "./routes/reviews.js";
import { reportsRouter } from "./routes/reports.js";
import { healthRouter } from "./routes/health.js";
import { analyticsRouter } from "./routes/analytics.js";
import { newsletterRouter } from "./routes/newsletter.js";
import { supportRouter } from "./routes/support.js";
import { db } from "./services/db.js";
import { requireAdminAuth } from "./services/adminAuth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== "test") {
      console.log(`[CampRoo API] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Routes
app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/spots", spotsRouter);
app.use("/api/requests", requestsRouter);
app.use("/api/threads", threadsRouter);
app.use("/api/posts", postsRouter);
app.use("/api/reviews", reviewsRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/newsletter", newsletterRouter);
app.use("/api/support", supportRouter);

// System status & Email logs for Admin modal (Strictly protected for admin aziz)
app.get("/api/system/status", requireAdminAuth, (req, res) => {
  const hasSupabase = Boolean(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_SERVICE_ROLE_KEY);
  res.json({
    status: "online",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    supabase: {
      active: hasSupabase,
      projectUrl: "https://tkyfoexwvbbblccfwyej.supabase.co"
    },
    providers: {
      google: { active: true, liveCredentials: hasSupabase, mode: hasSupabase ? "supabase" : "sandbox" },
      apple: { active: true, liveCredentials: hasSupabase, mode: hasSupabase ? "supabase" : "sandbox" },
      email: { active: true, provider: "resend", liveCredentials: true }
    }
  });
});

app.get("/api/email/logs", requireAdminAuth, (req, res) => {
  res.json({ logs: db.getEmailLogs() });
});

// Root fallback
app.get("/api", (req, res) => {
  res.json({
    message: "CampRoo Zero-Setup REST API",
    tagline: "Find a spot. Share a spot. Keep roaming.",
    documentation: "Ready out-of-the-box with zero external API key requirements.",
    endpoints: [
      "/api/health",
      "/api/auth/users",
      "/api/spots",
      "/api/requests",
      "/api/threads",
      "/api/posts",
      "/api/reviews",
      "/api/reports",
      "/api/analytics/stats",
      "/api/newsletter",
    ],
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("[CampRoo API Error]", err);
  res.status(500).json({ success: false, error: err.message || "Internal Server Error" });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🏕️  CampRoo Server running on http://127.0.0.1:${PORT}`);
  console.log(`🦘  Find a spot. Share a spot. Keep roaming.`);
  console.log(`✨  Zero-setup backend active: Persistent local storage seeded.`);
});

// Keep process active in ESM runtime
setInterval(() => {}, 60000);

export default app;

