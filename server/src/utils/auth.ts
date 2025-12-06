import jwt, { JwtPayload } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Define the expected JWT payload structure
interface CustomJwtPayload extends JwtPayload {
  userId: string;
}

// Generate JWT token with 30-day expiration
// This token is used for both regular email/password login and Google sign-in
export const generateToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  
  return jwt.sign({ userId }, secret, {
    expiresIn: '30d', // Extended from 7d to 30d for better user experience
  });
};

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

export const verifyToken = (token: string): CustomJwtPayload | string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return jwt.verify(token, secret) as CustomJwtPayload | string;
};

// Generate a random reset token
export const generateResetToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};