import mongoose from 'mongoose';
import User, { UserRole } from '../src/models/User';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const ADMIN_EMAIL = 'adityakumar2019.ak@gmail.com';

async function setAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/plannova');
    console.log('Connected to MongoDB');

    // Find the user by email
    let user = await User.findOne({ email: ADMIN_EMAIL });
    
    if (!user) {
      console.log(`User with email ${ADMIN_EMAIL} not found. Creating new admin user...`);
      
      // Create new admin user
      user = await User.create({
        email: ADMIN_EMAIL,
        firstName: 'Aditya',
        lastName: 'Kumar',
        role: UserRole.ADMIN,
        isActive: true,
        isVerified: true,
        provider: 'email'
      });
      
      console.log('✅ Admin user created successfully!');
    } else {
      // Update existing user to admin
      user.role = UserRole.ADMIN;
      user.isActive = true;
      user.isVerified = true;
      await user.save();
      
      console.log('✅ Existing user updated to admin role!');
    }

    console.log('Admin user details:');
    console.log(`- Email: ${user.email}`);
    console.log(`- Name: ${user.firstName} ${user.lastName}`);
    console.log(`- Role: ${user.role}`);
    console.log(`- Active: ${user.isActive}`);
    console.log(`- Verified: ${user.isVerified}`);

  } catch (error) {
    console.error('❌ Error setting admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
setAdminUser();
