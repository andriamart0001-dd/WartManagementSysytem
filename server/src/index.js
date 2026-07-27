// =============================================================================
// index.js — Application Entry Point
// =============================================================================
// This is the starting point of our backend server.
// It does the following in order:
//   1. Loads environment variables from the .env file
//   2. Creates the Express application
//   3. Registers global middleware (CORS, JSON parsing)
//   4. Mounts all route modules at their URL prefixes
//   5. Adds a catch-all handler for unknown routes (404)
//   6. Starts listening on the configured PORT
// =============================================================================

// Load environment variables first — must be called before anything else
// so that process.env.PORT, process.env.JWT_SECRET, etc. are all available
require('dotenv').config();

// Import Express
const express = require('express');

// Import the CORS library — this allows our React frontend (on a different port)
// to make requests to this backend without the browser blocking them
const cors = require('cors');

// Import route modules
const authRoutes = require('./modules/auth/authRoutes');
const usersRoutes = require('./modules/users/usersRoutes');
const wardRoutes = require('./modules/ward/wardRoutes');
const bedRoutes = require('./modules/bed/bedRoutes');
const admissionRoutes = require('./modules/admission/admissionRoutes');
const transferRoutes = require('./modules/transfer/transferRoutes');
const equipmentRoutes = require('./modules/equipment/equipmentRoutes');
const dashboardRoutes = require('./modules/dashboard/dashboardRoutes');
const hospitalRoutes = require('./modules/hospital/hospitalRoutes');
const alertRoutes = require('./modules/alert/shortageAlertRoutes');
const vitalsRoutes = require('./modules/vitals/vitalsRoutes');

// Create the Express application instance
const app = express();

// =============================================================================
// GLOBAL MIDDLEWARE
// Middleware runs on every request before it reaches a route handler.
// =============================================================================

// Enable CORS — only allow requests from our React frontend's URL
// CLIENT_ORIGIN is set in the .env file (e.g., http://localhost:5173)
// We also allow the Vercel production frontend explicitly.
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.CLIENT_ORIGIN,
      'https://ward-manage.vercel.app'
    ];
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse incoming JSON request bodies
// This lets us read req.body in our controller functions
app.use(express.json());

// =============================================================================
// ROUTE MOUNTING
// We "mount" each module's router at a specific URL prefix.
// Any route defined in authRoutes.js will be accessible under /api/auth/...
// Any route defined in usersRoutes.js will be accessible under /api/users/...
// =============================================================================

// Authentication routes: /api/auth/login, /api/auth/me
app.use('/api/auth', authRoutes);

// User management routes: /api/users (GET, POST, PUT, PATCH, DELETE)
app.use('/api/users', usersRoutes);

// Ward & Department routes: /api/wards, /api/departments
app.use('/api', wardRoutes); // using /api because wardRoutes handles both /departments and /wards

// Bed routes: /api/beds
app.use('/api/beds', bedRoutes);

// Admission routes: /api/admissions
app.use('/api/admissions', admissionRoutes);

// Vitals routes: /api/admissions/:id/vitals
app.use('/api/admissions/:id/vitals', vitalsRoutes);

// Transfer routes: /api/transfers
app.use('/api/transfers', transferRoutes);

// Equipment routes: /api/equipment
app.use('/api/equipment', equipmentRoutes);

// Dashboard routes: /api/dashboard
app.use('/api/dashboard', dashboardRoutes);

// External Hospital management routes: /api/hospitals
app.use('/api/hospitals', hospitalRoutes);

// Shortage Alert Log routes: /api/alerts
app.use('/api/alerts', alertRoutes);

// =============================================================================
// HEALTH CHECK ROUTE
// A simple endpoint to confirm the server is running.
// GET /api/health → returns a 200 OK with a status message
// =============================================================================
app.get('/api/health', (req, res) => {
  res.status(200).json({
    message: 'Hospital Ward Management API is running',
    timestamp: new Date().toISOString()
  });
});

// =============================================================================
// 404 HANDLER — Catch-All for Unknown Routes
// If a request reaches here, no route matched, so we return a 404 error.
// This MUST be registered AFTER all other routes.
// =============================================================================
app.use((req, res) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// =============================================================================
// GLOBAL ERROR HANDLER — Catch-All for Unexpected Server Errors (500)
// Ensures internal error details are logged server-side and clean JSON is returned
// =============================================================================
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    message: 'An unexpected server error occurred. Please try again later.'
  });
});


// =============================================================================
// START THE SERVER (Local Development)
// Read the port from .env (default to 5000 if not set).
// Only listen when running directly locally, not when imported as a module by Vercel.
// =============================================================================
const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log('========================================================');
    console.log(`  Hospital Ward Management API is running`);
    console.log(`  Server listening on http://localhost:${PORT}`);
    console.log(`  Environment: ${process.env.NODE_ENV}`);
    console.log('========================================================');
  });
}

// =============================================================================
// EXPORT THE EXPRESS APP
// Exporting the app allows Vercel serverless functions to process API requests.
// =============================================================================
module.exports = app;


