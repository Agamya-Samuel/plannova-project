import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.js";
import pool from "./src/db.js";
// Load environment variables
dotenv.config();
const app = express();
const port = process.env.PORT || 3500;
// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
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
// Example route to test PostgreSQL DB connection
app.get("/api/test-data", async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM "Test-Table"'); // using your Test-Table
        res.json({
            success: true,
            data: result.rows,
            count: result.rowCount
        });
    }
    catch (err) {
        console.error('Database query error:', err);
        res.status(500).json({
            success: false,
            error: "Server Error",
            details: err instanceof Error ? err.message : 'Unknown error'
        });
    }
});
// Route to insert data into Test-Table
app.post("/api/test-data", async (req, res) => {
    try {
        const { name, value } = req.body;
        const result = await pool.query('INSERT INTO "Test-Table" (name, value) VALUES ($1, $2) RETURNING *', [name, value]);
        res.json({
            success: true,
            message: 'Data inserted successfully',
            data: result.rows[0]
        });
    }
    catch (err) {
        console.error('Database insert error:', err);
        res.status(500).json({
            success: false,
            error: "Failed to insert data",
            details: err instanceof Error ? err.message : 'Unknown error'
        });
    }
});
// Health check endpoint for database
app.get("/api/health/db", async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW() as current_time');
        res.json({
            status: 'connected',
            timestamp: result.rows[0].current_time,
            message: 'PostgreSQL database connection is healthy'
        });
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