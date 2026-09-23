import mongoose from 'mongoose';
import { logger } from '../utils/logger';
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { User } from '../models/User';
import { Hostel } from '../models/Hostel';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, refreshAccessToken, revokeRefreshToken } from '../utils/jwt';

// ADMIN REGISTRATION
export const registerAdmin = async (req: Request, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { hostelName, adminName, adminEmail, adminPassword, mealPlan } = req.body;

    if (!hostelName?.trim() || !adminName?.trim() || !adminEmail?.trim() || !adminPassword?.trim()) {
      res.status(400).json({ message: 'All fields are required' });
      return;
    }

    if (adminPassword.length < 8) {
      res.status(400).json({ message: 'Password must be at least 8 characters long' });
      return;
    }

    const domain = hostelName
      .toLowerCase()
      .replace(/\s+/g, '')
      .substring(0, 10);

    const generatedUsername = `admin@${domain}`;

    const existingHostel = await Hostel.findOne({
      $or: [{ name: hostelName }, { domain }]
    });

    if (existingHostel) {
      if (existingHostel.name.toLowerCase() === hostelName.toLowerCase()) {
        res.status(400).json({ message: 'This hostel name is already registered. Please choose a different name.' });
      } else {
        res.status(400).json({ 
          message: `The domain (${domain}) is already in use by another facility. Please choose a distinct domain.` 
        });
      }
      return;
    }

    const finalMealPlan = mealPlan || [
      { mealName: 'Breakfast', offDays: [], categories: [{ categoryName: 'Main Course' }, { categoryName: 'Beverage' }, { categoryName: 'Bread' }, { categoryName: 'Condiment' }] },
      { mealName: 'Lunch', offDays: [], categories: [{ categoryName: 'Main Course' }, { categoryName: 'Lentils' }, { categoryName: 'Rice' }, { categoryName: 'Sides' }, { categoryName: 'Condiment' }, { categoryName: 'Bread' }] },
      { mealName: 'Snack', offDays: [], categories: [{ categoryName: 'Snacks' }] },
      { mealName: 'Dinner', offDays: [], categories: [{ categoryName: 'Main Course' }, { categoryName: 'Lentils' }, { categoryName: 'Rice' }, { categoryName: 'Sides' }, { categoryName: 'Dessert' }, { categoryName: 'Bread' }] }
    ];

    const hostel = new Hostel({ name: hostelName, domain, mealPlan: finalMealPlan });
    await hostel.save({ session });

    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const user = new User({
      hostelId: hostel._id,
      name: adminName,
      username: generatedUsername,
      email: adminEmail,
      role: 'ADMIN',
      isPrimaryAdmin: true,
      permissions: ['MANAGE_USERS', 'MANAGE_MENU', 'MANAGE_ISSUES', 'MANAGE_SETTINGS'],
      passwordHash,
    });
    await user.save({ session });

    await session.commitTransaction();
    
    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      username: user.username,
      role: user.role,
      hostelId: hostel._id.toString()
    });

    const refreshToken = await generateRefreshToken(user._id.toString());

    res.status(201).json({
      message: 'Admin registered successfully',
      hostel: { id: hostel._id, name: hostel.name, domain: hostel.domain },
      user: { id: user._id, name: user.name, username: user.username, email: user.email, role: user.role, isPrimaryAdmin: user.isPrimaryAdmin, permissions: user.permissions },
      accessToken,
      refreshToken
    });
  } catch (error) {
    await session.abortTransaction();
    logger.error('AUTH', `Admin registration error: ${(error as Error).message}`);
    res.status(500).json({ message: 'Internal server error during registration' });
  } finally {
    session.endSession();
  }
};

// UNIFIED LOGIN (Email & Password)
export const login = async (req: Request, res: Response): Promise<void> => {
    const { username, password } = req.body;

    if (!username?.trim() || !password?.trim()) {
      res.status(400).json({ message: 'Username and password are required' });
      return;
    }

    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) {
      res.status(401).json({ message: 'Invalid username or password' });
      return;
    }

    if (user.isActive === false) {
      res.status(403).json({ message: 'Your account has been deactivated. Please contact your admin.' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash || '');
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Invalid username or password' });
      return;
    }

    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      username: user.username,
      role: user.role,
      hostelId: user.hostelId.toString()
    });
    const refreshToken = await generateRefreshToken(user._id.toString());

    res.status(200).json({
      message: 'Login successful',
      user: { id: user._id, name: user.name, username: user.username, email: user.email, role: user.role, isPrimaryAdmin: user.isPrimaryAdmin, permissions: user.permissions },
      accessToken,
      refreshToken
    });
};



// REFRESH TOKEN
export const refresh = async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body;

    if (!refreshToken?.trim()) {
      res.status(400).json({ message: 'Refresh token is required' });
      return;
    }

    const userId = await verifyRefreshToken(refreshToken);
    if (!userId) {
      res.status(401).json({ message: 'Invalid or expired refresh token. Please login again.' });
      return;
    }

    const { accessToken, refreshToken: newRefreshToken } = await refreshAccessToken(userId);
    res.json({
      message: 'Token refreshed',
      tokens: { accessToken, refreshToken: newRefreshToken }
    });
};

// LOGOUT
export const logout = async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }
    res.json({ message: 'Logged out successfully' });
};