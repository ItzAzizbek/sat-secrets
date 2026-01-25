// server.js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const dotenv = require("dotenv");
const morgan = require("morgan");

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ["NODE_ENV", "PORT"];
const missingEnvVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingEnvVars.join(", ")}`);
  process.exit(1);
}

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5001;
const NODE_ENV = process.env.NODE_ENV || "development";
const isProduction = NODE_ENV === "production";

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// Helmet - Security headers
app.use(
  helmet({
    contentSecurityPolicy: isProduction,
    crossOriginEmbedderPolicy: false,
  })
);

// CORS Configuration
const allowedOrigins = isProduction
  ? ["https://sat-secrets.vercel.app"]
  : ["http://localhost:3000", "http://localhost:3001"];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-User-Email"],
  exposedHeaders: ["Content-Type", "X-Total-Count"],
  maxAge: 86400, // 24 hours
};

app.use(cors(corsOptions));

// Trust proxy (required for Vercel, Heroku, etc.)
app.set("trust proxy", 1);

// ============================================
// RATE LIMITING
// ============================================

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProduction ? 100 : 1000, // Limit each IP
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict limiter for sensitive endpoints
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many attempts, please try again later.",
});

app.use("/api/", apiLimiter);

// ============================================
// BODY PARSING & COMPRESSION
// ============================================

app.use(compression()); // Compress responses
app.use(express.json({ limit: "10mb" })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ============================================
// LOGGING
// ============================================

if (NODE_ENV === "development") {
  app.use(morgan("dev")); // Colorful dev logs
} else {
  app.use(morgan("combined")); // Apache-style logs for production
}

// ============================================
// REQUEST METADATA
// ============================================

// Add request ID and timestamp
app.use((req, res, next) => {
  req.id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  req.timestamp = new Date().toISOString();
  next();
});

// ============================================
// CUSTOM MIDDLEWARE
// ============================================

// Async handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Optional blacklist middleware
let checkBlacklist;
try {
  checkBlacklist = require("./middleware/checkBlacklist");
  app.use(checkBlacklist);
  console.log("✅ Blacklist middleware loaded");
} catch (error) {
  console.warn("⚠️  Blacklist middleware not loaded:", error.message);
}

// ============================================
// HEALTH CHECK & ROOT ROUTES
// ============================================

app.get("/", (req, res) => {
  res.json({
    message: "Secrets Of SAT API",
    version: "1.0.0",
    status: "operational",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + " MB",
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + " MB",
    },
  });
});

// Readiness check (can add DB ping here)
app.get("/ready", asyncHandler(async (req, res) => {
  // Add database connection check here if needed
  // await db.ping();
  
  res.status(200).json({
    status: "ready",
    timestamp: new Date().toISOString(),
  });
}));

// ============================================
// API ROUTES
// ============================================

const routes = [
  { path: "/api/contact", file: "./routes/contact", public: true },
  { path: "/api/orders", file: "./routes/orders", public: false },
  { path: "/api/admin", file: "./routes/admin", public: false, strict: true },
  { path: "/api/products", file: "./routes/products", public: true },
];

routes.forEach(({ path, file, public: isPublic, strict }) => {
  try {
    const route = require(file);
    
    // Apply strict rate limiting to sensitive routes
    if (strict) {
      app.use(path, strictLimiter, route);
    } else {
      app.use(path, route);
    }
    
    console.log(`✅ Loaded route: ${path}${!isPublic ? " (protected)" : ""}`);
  } catch (error) {
    console.error(`❌ Failed to load route ${path}:`, error.message);
    
    if (isProduction) {
      // In production, fail fast if routes don't load
      console.error("💥 Critical route failed to load. Exiting...");
      process.exit(1);
    }
  }
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  // Log error details
  console.error("❌ Error:", {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    timestamp: req.timestamp,
  });

  // CORS errors
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      error: "CORS policy violation",
      message: "Origin not allowed",
    });
  }

  // Validation errors
  if (err.name === "ValidationError") {
    return res.status(400).json({
      error: "Validation error",
      details: err.message,
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return res.status(401).json({
      error: "Authentication failed",
      message: err.message,
    });
  }

  // Default error response
  const statusCode = err.statusCode || err.status || 500;
  const errorResponse = {
    error: err.message || "Internal server error",
    requestId: req.id,
    timestamp: new Date().toISOString(),
  };

  // Only expose stack trace in development
  if (!isProduction) {
    errorResponse.stack = err.stack;
    errorResponse.details = err;
  }

  res.status(statusCode).json(errorResponse);
});

// ============================================
// SERVER STARTUP & GRACEFUL SHUTDOWN
// ============================================

let server;

const startServer = () => {
  server = app.listen(PORT, () => {
    console.log("\n" + "=".repeat(50));
    console.log(`✅ Secrets Of SAT API Server Started`);
    console.log("=".repeat(50));
    console.log(`📍 Environment: ${NODE_ENV}`);
    console.log(`🚀 Server:      http://localhost:${PORT}`);
    console.log(`🏥 Health:      http://localhost:${PORT}/health`);
    console.log(`📊 Ready:       http://localhost:${PORT}/ready`);
    console.log("=".repeat(50) + "\n");
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`❌ Port ${PORT} is already in use.`);
      console.error(`   Stop the other process or change PORT in .env`);
    } else {
      console.error("❌ Server failed to start:", err.message);
    }
    process.exit(1);
  });
};

// Graceful shutdown handler
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  if (server) {
    server.close((err) => {
      if (err) {
        console.error("❌ Error during shutdown:", err);
        process.exit(1);
      }

      console.log("✅ Server closed successfully");
      console.log("✅ All connections terminated");
      process.exit(0);
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
      console.error("⚠️  Forced shutdown after timeout");
      process.exit(1);
    }, 30000);
  } else {
    process.exit(0);
  }
};

// Handle shutdown signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught errors
process.on("uncaughtException", (err) => {
  console.error("💥 UNCAUGHT EXCEPTION:", err);
  gracefulShutdown("UNCAUGHT_EXCEPTION");
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("💥 UNHANDLED REJECTION at:", promise, "reason:", reason);
  gracefulShutdown("UNHANDLED_REJECTION");
});

// Start the server
startServer();

// Export for testing
module.exports = app;