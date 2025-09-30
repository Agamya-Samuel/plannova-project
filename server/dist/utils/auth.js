import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
export const generateToken = (userId) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET environment variable is not set');
    }
    return jwt.sign({ userId }, secret, {
        expiresIn: '7d',
    });
};
export const hashPassword = async (password) => {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
};
export const comparePassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
};
export const verifyToken = (token) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET environment variable is not set');
    }
    return jwt.verify(token, secret);
};
//# sourceMappingURL=auth.js.map