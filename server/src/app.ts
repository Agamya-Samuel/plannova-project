import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.js";
import venueRoutes from "./routes/venues.js";
import adminRoutes from "./routes/admin.js";
import analyticsRoutes from "./routes/analytics.js";
import uploadRoutes from "./routes/upload.js";
import bookingRoutes from "./routes/bookings.js";
import cateringRoutes from "./routes/catering.js";
import photographyRoutes from "./routes/photography.js";
import videographyRoutes from "./routes/videography.js";
import entertainmentRoutes from "./routes/entertainment.js";
import bridalMakeupRoutes from "./routes/bridalMakeup.js";
import decorationRoutes from "./routes/decoration.js";
import connectDB from "./db.js";

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Trust proxy settings - required when running behind a proxy
// This enables express-rate-limit to work correctly with X-Forwarded-For headers
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// Parse FRONTEND_URL environment variable (comma-separated domains)
const allowedOrigins = process.env.FRONTEND_URL!.split(',').map(url => url.trim())

if (process.env.NODE_ENV === 'development') {
  console.log('🌐 CORS allowed origins:', allowedOrigins);
}

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Rate limiting - more lenient in development
const limiter = rateLimit({
  windowMs: process.env.NODE_ENV === 'development' ? 60 * 1000 : 15 * 60 * 1000, // 1 minute in dev, 15 minutes in prod
  max: process.env.NODE_ENV === 'development' ? 2000 : 200, // 2000 requests in dev, 200 in prod
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for certain paths
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path.includes('/health');
  },
  // Add logging when rate limit is hit
  handler: (req, res) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('⚠️ Rate limit exceeded for:', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
      });
    }
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED'
    });
  },
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (in development)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`🔵 ${req.method} ${req.path}`);
    next();
  });
}

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/venues", venueRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/analytics", analyticsRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/catering", cateringRoutes);
app.use("/api/photography", photographyRoutes);
app.use("/api/videography", videographyRoutes);
app.use("/api/entertainment", entertainmentRoutes);
app.use("/api/bridal-makeup", bridalMakeupRoutes);
app.use("/api/decoration", decorationRoutes);

// Health check endpoint for database
app.get("/api/health/db", async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      res.json({ 
        status: 'connected', 
        timestamp: new Date().toISOString(),
        message: 'MongoDB database connection is healthy'
      });
    } else {
      res.status(500).json({ 
        status: 'error', 
        message: 'Database connection not ready',
        readyState: mongoose.connection.readyState
      });
    }
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Database health check failed:', err);
    }
    res.status(500).json({ 
      status: 'error', 
      message: 'Database connection failed',
      error: err instanceof Error ? err.message : 'Unknown error'
    });
  }
});

app.get("/api", (req, res) => {
    res.send({ message: "Hello from Express!" });
});

// Export the app for use by the server entry point
export default app;