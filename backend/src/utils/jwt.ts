import jwt from 'jsonwebtoken';
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
  const token = jwt.sign({ userId }, getSecretKey(), { expiresIn: REFRESH_TOKEN_EXPIRY });
  
  // Store refresh token in database
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  
  await RefreshToken.create({
    userId,
    token,
    expiresAt
  });
  
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
    const decoded = jwt.verify(token, getSecretKey()) as { userId: string };
    
    // Check if token exists in database
    const refreshTokenRecord = await RefreshToken.findOne({ 
      token,
      userId: decoded.userId 
    });
    
    if (!refreshTokenRecord) {
      return null;
    }
    
    // Check if token is expired
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
  const refreshToken = await generateRefreshToken(userId);
  
  return { accessToken, refreshToken };
};

export const revokeRefreshToken = async (token: string): Promise<void> => {
  await RefreshToken.deleteOne({ token });
};
