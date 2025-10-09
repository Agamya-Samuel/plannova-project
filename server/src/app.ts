import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.js";
import venueRoutes from "./routes/venues.js";
import uploadRoutes from "./routes/upload.js";
import connectDB from "./db.js";

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const port = process.env.PORT || 3001;

// Trust proxy settings - required when running behind a proxy
// This enables express-rate-limit to work correctly with X-Forwarded-For headers
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// Parse FRONTEND_URL environment variable (comma-separated domains)
const allowedOrigins = process.env.FRONTEND_URL!.split(',').map(url => url.trim())

console.log('🌐 CORS allowed origins:', allowedOrigins);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/venues", venueRoutes);
app.use("/api/upload", uploadRoutes);

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
    console.error('Database health check failed:', err);
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