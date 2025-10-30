import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// MongoDB connection function
const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    const dbName = process.env.DB_NAME;
    
    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    if (!dbName) {
      throw new Error('DB_NAME is not defined in environment variables');
    }

    // Construct full MongoDB URI with database name
    const fullMongoURI = `${mongoURI}/${dbName}`;

    const conn = await mongoose.connect(fullMongoURI);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Connected to MongoDB: ${conn.connection.host}/${conn.connection.name}`);
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ MongoDB connection error:', error);
    }
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('❌ MongoDB disconnected');
  }
});

mongoose.connection.on('error', (err) => {
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ MongoDB connection error:', err);
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  if (process.env.NODE_ENV === 'development') {
    console.log('MongoDB connection closed through app termination');
  }
  process.exit(0);
});

export default connectDB;