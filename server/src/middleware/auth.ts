import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import User, { UserRole } from '../models/User.js';
import { adminAuth } from '../firebase-admin.js';
import { Types } from 'mongoose';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole | null;
    firstName: string;
    lastName: string;
  };
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      console.log('🔍 Auth middleware - No token provided');
      return res.status(401).json({ error: 'Access token required' });
    }

    // Debug: Log token details
    console.log('🔍 Auth middleware - Token received:', {
      hasToken: !!token,
      tokenLength: token?.length,
      tokenStart: token?.substring(0, 20) + '...',
      tokenEnd: '...' + token?.substring(token.length - 20),
      authHeader: authHeader
    });

    // Try Firebase ID token first (for Google Sign-In and Firebase Auth)
    try {
      console.log('🔍 Attempting Firebase ID token verification...');
      const decodedToken = await adminAuth.verifyIdToken(token);
      
      console.log('🔍 Firebase token decoded:', {
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name
      });
      
      // Find or create user in MongoDB
      let user = await User.findOne({ 
        $or: [
          { firebaseUid: decodedToken.uid },
          { email: decodedToken.email }
        ]
      }).select('-password');

      console.log('🔍 User lookup result:', user ? 'Found' : 'Not found');

      if (!user && decodedToken.email) {
        // Create new user from Firebase token
        console.log('🔍 Creating new user from Firebase token');
        const nameParts = decodedToken.name?.split(' ') || ['', ''];
        user = await User.create({
          firebaseUid: decodedToken.uid,
          email: decodedToken.email,
          firstName: nameParts[0] || 'User',
          lastName: nameParts.slice(1).join(' ') || '',
          role: null, // New Google users need to select role
          isActive: true,
          isVerified: decodedToken.email_verified || false,
          provider: decodedToken.firebase?.sign_in_provider || 'email'
        });
        console.log('🔍 New user created:', user._id);
      } else if (user && !user.firebaseUid) {
        // Link existing user with Firebase UID
        console.log('🔍 Linking existing user with Firebase UID');
        user.firebaseUid = decodedToken.uid;
        await user.save();
      }

      if (!user || !user.isActive) {
        console.log('🔍 User not found or inactive');
        return res.status(401).json({ error: 'Invalid or inactive user' });
      }

      console.log('🔍 User authenticated successfully:', {
        id: (user._id as Types.ObjectId).toString(),
        email: user.email,
        role: user.role
      });

      req.user = {
        id: (user._id as Types.ObjectId).toString(),
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      };
      return next();
      
    } catch (firebaseError) {
      console.error('Firebase token verification failed:', {
        error: firebaseError,
        message: (firebaseError as Error)?.message,
        code: (firebaseError as { code?: string })?.code,
        tokenLength: token?.length,
        tokenStart: token?.substring(0, 50) + '...'
      });
      
      // If Firebase token verification fails, try JWT token (for backward compatibility)
      try {
        console.log('🔍 Attempting JWT token verification...');
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
        
        console.log('🔍 JWT token decoded:', decoded);
        
        const user = await User.findById(decoded.userId).select('-password');

        console.log('🔍 JWT user lookup result:', user ? 'Found' : 'Not found');

        if (!user || !user.isActive) {
          console.log('🔍 JWT User not found or inactive');
          return res.status(401).json({ error: 'Invalid or inactive user' });
        }

        console.log('🔍 JWT User authenticated successfully:', {
          id: (user._id as Types.ObjectId).toString(),
          email: user.email,
          role: user.role
        });

        req.user = {
          id: (user._id as Types.ObjectId).toString(),
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
        };
        return next();
        
      } catch (jwtError) {
        console.error('JWT verification failed:', {
          error: jwtError,
          message: (jwtError as Error)?.message,
          tokenLength: token?.length,
          tokenStart: token?.substring(0, 50) + '...'
        });
        return res.status(403).json({ error: 'Invalid token' });
      }
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(403).json({ error: 'Invalid token' });
  }
};

export const requireRole = (roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      console.log('🔍 Role check failed: No user authenticated');
      return res.status(401).json({ error: 'Authentication required' });
    }

    // If user hasn't selected a role yet, they need to complete role selection
    if (req.user.role === null) {
      console.log('🔍 Role check failed: Role not selected');
      return res.status(403).json({ error: 'Role selection required' });
    }

    console.log('🔍 Role check:', {
      userRole: req.user.role,
      requiredRoles: roles,
      hasPermission: roles.includes(req.user.role)
    });

    if (!roles.includes(req.user.role)) {
      console.log('🔍 Role check failed: Insufficient permissions');
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    console.log('🔍 Role check passed');
    next();
  };
};

export const requireAdmin = requireRole([UserRole.ADMIN]);
export const requireStaff = requireRole([UserRole.STAFF]);
export const requireStaffOrAdmin = requireRole([UserRole.STAFF, UserRole.ADMIN]);
export const requireProvider = requireRole([UserRole.PROVIDER, UserRole.ADMIN]);
export const requireCustomer = requireRole([UserRole.CUSTOMER, UserRole.PROVIDER, UserRole.ADMIN]);