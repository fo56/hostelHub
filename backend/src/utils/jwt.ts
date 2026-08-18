import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { RefreshToken } from '../models/RefreshToken';
import { User } from '../models/User';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

const getSecretKey = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return secret;
};

// Helper function to hash tokens before storing/comparing in DB
const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  hostelId: string;
}

export const generateAccessToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, getSecretKey(), { expiresIn: ACCESS_TOKEN_EXPIRY });
};

export const generateRefreshToken = async (userId: string): Promise<string> => {
  // Generate the plain JWT
  const token = jwt.sign({ userId }, getSecretKey(), { expiresIn: REFRESH_TOKEN_EXPIRY });
  
  // Hash the JWT for database storage
  const hashedToken = hashToken(token);
  
  // Store the hashed refresh token in database
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  
  await RefreshToken.create({
    userId,
    token: hashedToken,
    expiresAt
  });
  
  // Return the plain JWT to the client
  return token;
};

export const verifyAccessToken = (token: string): JWTPayload | null => {
  try {
    const payload = jwt.verify(token, getSecretKey()) as JWTPayload;
    return payload;
  } catch (error) {
    return null;
  }
};

export const verifyRefreshToken = async (token: string): Promise<string | null> => {
  try {
    // Verify the JWT signature and expiry first
    const decoded = jwt.verify(token, getSecretKey()) as { userId: string };
    
    // Hash the incoming token to look it up in the database
    const hashedToken = hashToken(token);
    
    // Use findOneAndDelete to automatically remove the token from the DB.
    // This enforces Refresh Token Rotation (one-time use).
    const refreshTokenRecord = await RefreshToken.findOneAndDelete({ 
      token: hashedToken,
      userId: decoded.userId 
    });
    
    // If it doesn't exist, it might have been used already (or never existed)
    if (!refreshTokenRecord) {
      return null;
    }
    
    // Check if token is expired in DB (defense in depth, though jwt.verify also checks)
    if (new Date() > refreshTokenRecord.expiresAt) {
      return null;
    }
    
    return decoded.userId;
  } catch (error) {
    return null;
  }
};

export const refreshAccessToken = async (userId: string): Promise<{ accessToken: string; refreshToken: string }> => {
  const user = await User.findById(userId);
  
  if (!user || !user.isActive) {
    throw new Error('User not found or inactive');
  }
  
  const payload: JWTPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    hostelId: user.hostelId.toString()
  };
  
  const accessToken = generateAccessToken(payload);
  
  // The old refresh token was already deleted in verifyRefreshToken.
  // We just need to generate a new one.
  const refreshToken = await generateRefreshToken(userId);
  
  return { accessToken, refreshToken };
};

export const revokeRefreshToken = async (token: string): Promise<void> => {
  // Hash the token before attempting to delete it from the DB
  const hashedToken = hashToken(token);
  await RefreshToken.deleteOne({ token: hashedToken });
};