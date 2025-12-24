// controllers/user.controller.ts
import { Request, Response } from 'express';
import { User } from '../models/User';
import { ActivityLog } from '../models/ActivityLog';
import { Hostel } from '../models/Hostel';

export const getMe = async (req: Request, res: Response) => {
  const user = req.user as any;

  res.json({
    id: user._id,
    role: user.role,
    hostelId: user.hostelId,
    name: user.name ?? null,
    email: user.email ?? null
  });
};
