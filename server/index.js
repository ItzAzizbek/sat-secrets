const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
const corsOptions = {
  origin: 'http://localhost:5173', // your frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Email'],
  exposedHeaders: ['Content-Type'], // make sure JSON body is readable
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
} catch (error) {
  console.warn('Blacklist middleware not loaded:', error.message);
  // Continue without blacklist if it fails
}

// Routes (Placeholder)
app.get("/", (req, res) => {
  res.send("Secrets Of SAT API is running");
});

// Import Routes
try {
  const contactRoutes = require("./routes/contact");
  const ordersRoutes = require("./routes/orders");
  const adminRoutes = require("./routes/admin");
  const productsRoutes = require("./routes/products");

  app.use("/api/contact", contactRoutes);
  app.use("/api/orders", ordersRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/products", productsRoutes);
} catch (error) {
  console.error('Error loading routes:', error);
}

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
