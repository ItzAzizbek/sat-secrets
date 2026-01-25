const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
const corsOptions = {
  origin: 'https://sat-secrets.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Email'],
  exposedHeaders: ['Content-Type'],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('trust proxy', true)

// Error handling middleware for async routes
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Try to load blacklist middleware, but don't fail if it has issues
let checkBlacklist;
try {
  checkBlacklist = require('./middleware/checkBlacklist');
  app.use(checkBlacklist);
  console.log('✅ Blacklist middleware loaded');
} catch (error) {
  console.warn('⚠️  Blacklist middleware not loaded:', error.message);
}

// Routes (Placeholder)
app.get("/", (req, res) => {
  res.send("Secrets Of SAT API is running");
});

// Import and mount routes
const routes = [
  { path: "/api/contact", file: "./routes/contact" },
  { path: "/api/orders", file: "./routes/orders" },
  { path: "/api/admin", file: "./routes/admin" },
  { path: "/api/products", file: "./routes/products" }
];

routes.forEach(({ path, file }) => {
  try {
    const route = require(file);
    app.use(path, route);
    console.log(`✅ Loaded route: ${path}`);
  } catch (error) {
    console.error(`❌ Failed to load route ${path}:`, error.message);
    console.error(`   Make sure ${file}.js exists and exports a router`);
    process.exit(1);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server with error handling
app.listen(PORT, () => {
  console.log(`✅ Secrets Of SAT API server running on port ${PORT}`);
  console.log(`   http://localhost:${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please stop the other process or change the PORT in .env`);
  } else {
    console.error('❌ Server failed to start:', err.message);
  }
  process.exit(1);
});