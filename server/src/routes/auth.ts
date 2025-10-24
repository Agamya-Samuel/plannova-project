import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { Types } from 'mongoose';
import User, { UserRole, ServiceCategory } from '../models/User.js';
import PasswordResetToken from '../models/PasswordResetToken.js';
import { hashPassword, comparePassword, generateToken, generateResetToken } from '../utils/auth.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { adminAuth } from '../firebase-admin.js';
import { sendPasswordResetEmail } from '../utils/emailService.js';

const router = Router();

// Validation middleware
const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').trim().isLength({ min: 1 }),
  body('lastName').trim().isLength({ min: 1 }),
  body('role').optional().isIn(['CUSTOMER', 'PROVIDER', 'ADMIN']),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').exists(),
];

const forgotPasswordValidation = [
  body('email').isEmail().normalizeEmail(),
];

const resetPasswordValidation = [
  body('token').notEmpty(),
  body('password').isLength({ min: 6 }),
];

// Register endpoint
router.post('/register', registerValidation, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, firstName, lastName, phone, role = 'CUSTOMER' } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone,
      role: role as UserRole,
    });

    // Convert to plain object and remove password - consistent with other endpoints
    const userResponse = {
      id: (user._id as Types.ObjectId).toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      serviceCategories: user.serviceCategories,
      photoURL: user.photoURL,
      provider: user.provider,
      isActive: user.isActive,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    // Generate token
    const token = generateToken((user._id as Types.ObjectId).toString());

    res.status(201).json({
      message: 'User created successfully',
      user: userResponse,
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login endpoint
router.post('/login', loginValidation, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password (only for email/password users)
    if (!user.password || typeof user.password !== 'string') {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken((user._id as Types.ObjectId).toString());

    // Return user data (without password) - consistent with other endpoints
    const userData = {
      id: (user._id as Types.ObjectId).toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      serviceCategories: user.serviceCategories,
      photoURL: user.photoURL,
      provider: user.provider,
      isActive: user.isActive,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.json({
      message: 'Login successful',
      user: userData,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Convert to plain object with id instead of _id
    const userResponse = {
      id: (user._id as Types.ObjectId).toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      serviceCategories: user.serviceCategories,
      isActive: user.isActive,
      isVerified: user.isVerified,
      photoURL: user.photoURL,
      provider: user.provider,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.json(userResponse);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { firstName, lastName, phone } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        firstName,
        lastName,
        phone,
      },
      { new: true, select: '-password' }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Convert to response format (consistent with get profile endpoint)
    const userResponse = {
      id: (updatedUser._id as Types.ObjectId).toString(),
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      phone: updatedUser.phone,
      role: updatedUser.role,
      serviceCategories: updatedUser.serviceCategories,
      isActive: updatedUser.isActive,
      isVerified: updatedUser.isVerified,
      photoURL: updatedUser.photoURL,
      provider: updatedUser.provider,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };

    res.json({
      message: 'Profile updated successfully',
      user: userResponse,
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Google Sign-In endpoint
router.post('/google', async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: 'ID token is required' });
    }

    // Verify the Firebase ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    console.log('🔍 Google Sign-In - Decoded token data:', {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
      picture: decodedToken.picture,
      email_verified: decodedToken.email_verified,
    });
    
    // Check if user already exists
    let user = await User.findOne({
      $or: [
        { firebaseUid: decodedToken.uid },
        { email: decodedToken.email }
      ]
    });

    if (user) {
      // Update existing user with Firebase UID and photo if not set
      let needsUpdate = false;
      
      if (!user.firebaseUid) {
        user.firebaseUid = decodedToken.uid;
        user.provider = decodedToken.firebase?.sign_in_provider || 'google.com';
        user.isVerified = decodedToken.email_verified || false;
        needsUpdate = true;
      }
      
      // Always update photoURL from Google if available
      if (decodedToken.picture && user.photoURL !== decodedToken.picture) {
        user.photoURL = decodedToken.picture;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await user.save();
      }
    } else {
      // Create new user from Google account - but don't assign role yet
      const nameParts = decodedToken.name?.split(' ') || ['User', ''];
      user = await User.create({
        firebaseUid: decodedToken.uid,
        email: decodedToken.email,
        firstName: nameParts[0] || 'User',
        lastName: nameParts.slice(1).join(' ') || '',
        role: null, // No role assigned yet - user needs to select
        isActive: true,
        isVerified: decodedToken.email_verified || false,
        provider: decodedToken.firebase?.sign_in_provider || 'google.com',
        photoURL: decodedToken.picture || null
      });
    }

    // Return user data and Firebase ID token (which acts as JWT)
    const userData = {
      id: (user._id as Types.ObjectId).toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      serviceCategories: user.serviceCategories,
      photoURL: user.photoURL,
      provider: user.provider,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
    };

    console.log('🚀 Google Sign-In - Sending response with user data:', userData);
    // Check if user needs to select a role
    const needsRoleSelection = user.role === null;
    // We no longer check for mobile number during login - this is handled on the dashboard

    res.json({
      message: 'Google sign-in successful',
      user: userData,
      token: idToken, // Use Firebase ID token as auth token
      needsRoleSelection, // Indicates if frontend should show role selection
      // Removed needsMobileNumber flag since we handle this on the dashboard
    });
  } catch (error) {
    console.error('Google sign-in error:', error);
    res.status(500).json({ error: 'Google sign-in failed' });
  }
});

// Update user role for Google sign-in users
router.post('/update-role', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { role } = req.body;

    // Validate role
    if (!role || !Object.values(UserRole).includes(role)) {
      return res.status(400).json({ error: 'Invalid role provided' });
    }

    // Find and update user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Only allow updating role if it's currently null (new Google users)
    if (user.role !== null) {
      return res.status(400).json({ error: 'User role is already set' });
    }

    // Update the role
    user.role = role;
    await user.save();

    // Return updated user data (consistent with other endpoints)
    const userData = {
      id: (user._id as Types.ObjectId).toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      serviceCategories: user.serviceCategories,
      isActive: user.isActive,
      isVerified: user.isVerified,
      photoURL: user.photoURL,
      provider: user.provider,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.json({
      message: 'Role updated successfully',
      user: userData,
    });
  } catch (error) {
    console.error('Role update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update service categories for providers
router.post('/update-service-categories', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { serviceCategories } = req.body;

    // Validate service categories
    if (!serviceCategories || !Array.isArray(serviceCategories)) {
      return res.status(400).json({ error: 'Service categories are required' });
    }

    // Validate that at least one service category is selected
    if (serviceCategories.length < 1) {
      return res.status(400).json({ error: 'Providers must select at least one service category' });
    }

    const validCategories: ServiceCategory[] = ['venue', 'catering', 'photography', 'videography', 'music', 'makeup', 'decoration'];
    
    // Validate all selected categories
    for (const category of serviceCategories) {
      if (!validCategories.includes(category as ServiceCategory)) {
        return res.status(400).json({ error: `Invalid service category provided: ${category}` });
      }
    }

    // Find and update user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is a provider
    if (user.role !== UserRole.PROVIDER) {
      return res.status(403).json({ error: 'Only providers can set service categories' });
    }

    // Update the service categories (multiple allowed)
    user.serviceCategories = serviceCategories as ServiceCategory[];
    await user.save();

    // Return updated user data (consistent with other endpoints)
    const userData = {
      id: (user._id as Types.ObjectId).toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      serviceCategories: user.serviceCategories,
      isActive: user.isActive,
      isVerified: user.isVerified,
      photoURL: user.photoURL,
      provider: user.provider,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.json({
      message: 'Service categories updated successfully',
      user: userData,
    });
  } catch (error) {
    console.error('Service categories update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout endpoint (client-side token removal)
router.post('/logout', (req: Request, res: Response) => {
  res.json({ message: 'Logout successful' });
});

// Forgot password endpoint
router.post('/forgot-password', forgotPasswordValidation, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      // For security reasons, we don't reveal if the email exists
      return res.status(200).json({ 
        message: 'If an account with that email exists, a password reset link has been sent.' 
      });
    }

    // Generate reset token
    const resetToken = generateResetToken();
    const resetTokenHash = await hashPassword(resetToken); // Hash the token for storage
    
    // Set token expiration (1 hour)
    const resetExpires = new Date(Date.now() + 3600000);

    // Save token and expiration to separate collection
    await PasswordResetToken.create({
      userId: user._id,
      token: resetTokenHash,
      expiresAt: resetExpires
    });

    // Send reset email
    const emailResult = await sendPasswordResetEmail(email, resetToken);
    
    if (emailResult.success) {
      res.status(200).json({ 
        message: 'If an account with that email exists, a password reset link has been sent.' 
      });
    } else {
      console.error('Failed to send password reset email:', emailResult.error);
      res.status(500).json({ error: 'Failed to send password reset email' });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset password endpoint
router.post('/reset-password', resetPasswordValidation, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, password } = req.body;

    // Find valid reset token
    const passwordResetToken = await PasswordResetToken.findOne({
      expiresAt: { $gt: new Date() }
    }).populate('userId');

    if (!passwordResetToken) {
      return res.status(400).json({ error: 'Password reset token is invalid or has expired' });
    }

    // Verify token
    const isTokenValid = await comparePassword(token, passwordResetToken.token);
    
    if (!isTokenValid) {
      return res.status(400).json({ error: 'Password reset token is invalid or has expired' });
    }

    // Hash new password
    const hashedPassword = await hashPassword(password);

    // Update user password
    const user = await User.findById(passwordResetToken.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    user.password = hashedPassword;
    await user.save();

    // Delete the used token
    await PasswordResetToken.deleteOne({ _id: passwordResetToken._id });

    res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;