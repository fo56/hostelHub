// controllers/user.controller.ts
import { Request, Response } from 'express';
import { User } from '../models/User';
import bcrypt from 'bcrypt';

export const getMe = async (req: Request, res: Response) => {
    const userPayload = req.user as any;
    const dbUser = await User.findById(userPayload._id);
    
    if (!dbUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: dbUser._id,
      role: dbUser.role,
      hostelId: dbUser.hostelId,
      name: dbUser.name ?? null,
      email: dbUser.email ?? null,
      username: dbUser.username ?? null,
      roomNo: dbUser.roomNo ?? null,
      isPrimaryAdmin: dbUser.isPrimaryAdmin,
      permissions: dbUser.permissions
    });
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
    const userPayload = req.user as any;
    const { name, password, email } = req.body;

    const dbUser = await User.findById(userPayload._id);
    if (!dbUser) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (name) {
      dbUser.name = name;
    }

    if (email !== undefined) {
      if (email.trim() !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          res.status(400).json({ message: 'Invalid email format' });
          return;
        }
        
        // check for uniqueness manually for cleaner 409
        const existingUser = await User.findOne({ email, _id: { $ne: dbUser._id } });
        if (existingUser) {
          res.status(409).json({ message: 'Email is already in use by another account' });
          return;
        }
        dbUser.email = email;
      } else {
        // clear email
        dbUser.email = null as any; 
      }
    }

    if (password) {
      if (password.length < 8) {
        res.status(400).json({ message: 'Password must be at least 8 characters' });
        return;
      }
      dbUser.passwordHash = await bcrypt.hash(password, 10);
    }

    await dbUser.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: dbUser._id,
        name: dbUser.name,
        email: dbUser.email,
        username: dbUser.username,
        role: dbUser.role,
        roomNo: dbUser.roomNo
      }
    });
};
