import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
export const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                role: true,
                firstName: true,
                lastName: true,
                isActive: true,
            },
        });
        if (!user || !user.isActive) {
            return res.status(401).json({ error: 'Invalid or inactive user' });
        }
        req.user = user;
        next();
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
export const requireAdmin = requireRole(['ADMIN']);
export const requireProvider = requireRole(['PROVIDER', 'ADMIN']);
export const requireCustomer = requireRole(['CUSTOMER', 'PROVIDER', 'ADMIN']);
//# sourceMappingURL=auth.js.map