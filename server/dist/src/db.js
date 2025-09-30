import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();
// Create a connection pool
const pool = new Pool({
    user: process.env.DB_USER || 'postgres', // your PostgreSQL username
    host: process.env.DB_HOST || 'localhost', // server hosting the DB
    database: process.env.DB_NAME || 'Test-db', // your database name
    password: process.env.DB_PASSWORD || 'mypassword', // your PostgreSQL password
    port: parseInt(process.env.DB_PORT || '5432'), // default PostgreSQL port
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});
// Test the connection
pool.on('connect', () => {
    console.log('✅ Connected to PostgreSQL database');
});
pool.on('error', (err) => {
    console.error('❌ PostgreSQL connection error:', err);
});
// Export the pool for use in other files
export default pool;
//# sourceMappingURL=db.js.map