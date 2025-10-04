import mongoose from 'mongoose';
import User, { UserRole } from '../dist/src/models/User.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const ADMIN_EMAIL = 'adityakumar2019.ak@gmail.com';

async function checkAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/plannova');
    console.log('Connected to MongoDB');

    // Find the admin user
    const adminUser = await User.findOne({ email: ADMIN_EMAIL });
    
    if (adminUser) {
      console.log('✅ Admin user found:');
      console.log(`- Email: ${adminUser.email}`);
      console.log(`- Name: ${adminUser.firstName} ${adminUser.lastName}`);
      console.log(`- Role: ${adminUser.role}`);
      console.log(`- Active: ${adminUser.isActive}`);
      console.log(`- Verified: ${adminUser.isVerified}`);
      console.log(`- ID: ${adminUser._id}`);
    } else {
      console.log('❌ Admin user not found!');
    }

    // Count total users
    const totalUsers = await User.countDocuments();
    console.log(`\nTotal users in database: ${totalUsers}`);

    // List all users
    const allUsers = await User.find({}).select('email firstName lastName role isActive');
    console.log('\nAll users:');
    allUsers.forEach(user => {
      console.log(`- ${user.email} (${user.firstName} ${user.lastName}) - ${user.role} - Active: ${user.isActive}`);
    });

  } catch (error) {
    console.error('❌ Error checking admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the script
checkAdminUser();
