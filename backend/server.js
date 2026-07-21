const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const labRoutes = require("./routes/labRoutes");
const hospitalRoutes = require("./routes/hospitalRoutes");
const clinicRoutes = require("./routes/clinicRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const homeRoutes = require("./routes/homeRoutes");
const ensureAdminAccount = require("./utils/ensureAdminAccount");

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/medixo";

const defaultClientUrls = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://medixo-git-main-cyberbhanus-projects.vercel.app",
];

const normalizeOrigin = (origin) => origin.trim().replace(/\/+$/, "");

const allowedOrigins = (process.env.CLIENT_URL || defaultClientUrls.join(","))
  .split(",")
  .map(normalizeOrigin)
  .filter(Boolean);

const isAllowedOrigin = (origin) => {
  const normalizedOrigin = normalizeOrigin(origin);
  if (allowedOrigins.includes(normalizedOrigin)) {
    return true;
  }

  try {
    const { hostname, protocol } = new URL(normalizedOrigin);
    return protocol === "https:" && hostname.endsWith(".vercel.app");
  } catch {
    return false;
  }
};

const corsOptions = {
  origin(origin, callback) {
    if (!origin || isAllowedOrigin(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Origin is not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.RATE_LIMIT_MAX || 300),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT_MAX || 30),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please try again later." },
});

// Middleware
app.set("trust proxy", 1);
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(generalLimiter);

app.get("/api/health", (_req, res) => {
  const mongoState = mongoose.connection.readyState;

  res.status(mongoState === 1 ? 200 : 503).json({
    status: mongoState === 1 ? "ok" : "starting",
    database: ["disconnected", "connected", "connecting", "disconnecting"][mongoState] || "unknown",
  });
});

// API Routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/labs", labRoutes);
app.use("/api/hospitals", hospitalRoutes);
app.use("/api/clinics", clinicRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/home", homeRoutes);

app.use((err, _req, res, _next) => {
  if (err.message === "Origin is not allowed by CORS") {
    return res.status(403).json({ error: err.message });
  }

  console.error("Unhandled server error:", err);
  return res.status(500).json({ error: "Internal server error" });
});

// Database Connection
mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 10000,
})
  .then(() => {
    console.log("MongoDB connected successfully");
    ensureAdminAccount().catch((error) => {
      console.error("Failed to ensure admin account:", error);
    });
  })
  .catch((err) => {
    console.error("Database connection error:", err);
    process.exit(1);
  });

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
