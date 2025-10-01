import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.js";
import connectDB from "./src/db.js";
// Load environment variables
dotenv.config();
// Connect to MongoDB
connectDB();
const app = express();
const port = process.env.PORT || 3000;
// Security middleware
app.use(helmet());
app.use(cors({
    origin: ["http://localhost:3003", "http://localhost:3002", "http://localhost:3001", "http://localhost:3000"],
    credentials: true,
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
// Health check endpoint for database
app.get("/api/health/db", async (req, res) => {
    try {
        if (mongoose.connection.readyState === 1) {
            res.json({
                status: 'connected',
                timestamp: new Date().toISOString(),
                message: 'MongoDB database connection is healthy'
            });
        }
        else {
            res.status(500).json({
                status: 'error',
                message: 'Database connection not ready',
                readyState: mongoose.connection.readyState
            });
        }
    }
    catch (err) {
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
app.listen(port, () => console.log(`Listening on port ${port}`));
//# sourceMappingURL=app.js.map