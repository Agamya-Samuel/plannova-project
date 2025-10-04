import mongoose, { Document, Schema } from 'mongoose';

// Define UserRole enum
export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  PROVIDER = 'PROVIDER',
  ADMIN = 'ADMIN'
}

// Define the User interface
export interface IUser extends Document {
  email: string;
  password?: string; // Made optional for Google Sign-In users
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole | null;
  isActive: boolean;
  isVerified: boolean;
  firebaseUid?: string; // Firebase UID for Google Sign-In
  provider?: string; // Authentication provider (email, google.com, etc.)
  photoURL?: string; // Profile picture URL
  createdAt: Date;
  updatedAt: Date;
}

// Create the User schema
const UserSchema: Schema<IUser> = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: false // Not required for Google Sign-In users
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: false,
    trim: true
  },
  firebaseUid: {
    type: String,
    required: false,
    unique: true,
    sparse: true // Allows multiple null values
  },
  provider: {
    type: String,
    required: false,
    default: 'email'
  },
  photoURL: {
    type: String,
    required: false
  },
  role: {
    type: String,
    enum: Object.values(UserRole),
    default: null, // Allow null for new Google users who haven't selected role yet
    required: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true, // This adds createdAt and updatedAt automatically
  collection: 'users'
});

// Create and export the User model
export const User = mongoose.model<IUser>('User', UserSchema);
export default User;