import jwt from 'jsonwebtoken';
import User, { UserRole } from '../src/models/User.js';
import { adminAuth } from '../src/firebase-admin.js';
export const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }
        // Try Firebase ID token first (for Google Sign-In and Firebase Auth)
        try {
            const decodedToken = await adminAuth.verifyIdToken(token);
            // Find or create user in MongoDB
            let user = await User.findOne({
                $or: [
                    { firebaseUid: decodedToken.uid },
                    { email: decodedToken.email }
                ]
            }).select('-password');
            if (!user && decodedToken.email) {
                // Create new user from Firebase token
                const nameParts = decodedToken.name?.split(' ') || ['', ''];
                user = await User.create({
                    firebaseUid: decodedToken.uid,
                    email: decodedToken.email,
                    firstName: nameParts[0] || 'User',
                    lastName: nameParts.slice(1).join(' ') || '',
                    role: UserRole.CUSTOMER,
                    isActive: true,
                    isVerified: decodedToken.email_verified || false,
                    provider: decodedToken.firebase?.sign_in_provider || 'email'
                });
            }
            else if (user && !user.firebaseUid) {
                // Link existing user with Firebase UID
                user.firebaseUid = decodedToken.uid;
                await user.save();
            }
            if (!user || !user.isActive) {
                return res.status(401).json({ error: 'Invalid or inactive user' });
            }
            req.user = {
                id: user._id.toString(),
                email: user.email,
                role: user.role,
                firstName: user.firstName,
                lastName: user.lastName,
            };
            return next();
        }
        catch (firebaseError) {
            // If Firebase token verification fails, try JWT token (for backward compatibility)
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = await User.findById(decoded.userId).select('-password');
                if (!user || !user.isActive) {
                    return res.status(401).json({ error: 'Invalid or inactive user' });
                }
                req.user = {
                    id: user._id.toString(),
                    email: user.email,
                    role: user.role,
                    firstName: user.firstName,
                    lastName: user.lastName,
                };
                return next();
            }
            catch (jwtError) {
                return res.status(403).json({ error: 'Invalid token' });
            }
        }
    }
    catch (error) {
        return res.status(403).json({ error: 'Invalid token' });
    }
};
export const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
};
export const requireAdmin = requireRole([UserRole.ADMIN]);
export const requireProvider = requireRole([UserRole.PROVIDER, UserRole.ADMIN]);
export const requireCustomer = requireRole([UserRole.CUSTOMER, UserRole.PROVIDER, UserRole.ADMIN]);
//# sourceMappingURL=auth.js.map