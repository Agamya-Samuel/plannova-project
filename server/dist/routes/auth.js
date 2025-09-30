import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword, generateToken } from '../utils/auth.js';
import { authenticateToken } from '../middleware/auth.js';
const router = Router();
const prisma = new PrismaClient();
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
// Register endpoint
router.post('/register', registerValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { email, password, firstName, lastName, phone, role = 'CUSTOMER' } = req.body;
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists with this email' });
        }
        // Hash password
        const hashedPassword = await hashPassword(password);
        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                firstName,
                lastName,
                phone,
                role: role,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                createdAt: true,
            },
        });
        // Generate token
        const token = generateToken(user.id);
        res.status(201).json({
            message: 'User created successfully',
            user,
            token,
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Login endpoint
router.post('/login', loginValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { email, password } = req.body;
        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
        });
        if (!user || !user.isActive) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Check password
        const isValidPassword = await comparePassword(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Generate token
        const token = generateToken(user.id);
        // Return user data (without password)
        const userData = {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            createdAt: user.createdAt,
        };
        res.json({
            message: 'Login successful',
            user: userData,
            token,
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                role: true,
                isActive: true,
                isVerified: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    }
    catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const { firstName, lastName, phone } = req.body;
        const updatedUser = await prisma.user.update({
            where: { id: req.user.id },
            data: {
                firstName,
                lastName,
                phone,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                role: true,
                updatedAt: true,
            },
        });
        res.json({
            message: 'Profile updated successfully',
            user: updatedUser,
        });
    }
    catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Logout endpoint (client-side token removal)
router.post('/logout', (req, res) => {
    res.json({ message: 'Logout successful' });
});
export default router;
//# sourceMappingURL=auth.js.map