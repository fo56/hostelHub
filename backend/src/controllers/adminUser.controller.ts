import { Request, Response } from 'express';
import { User } from '../models/User';
import { ActivityLog } from '../models/ActivityLog';
import { Hostel } from '../models/Hostel';
import QRCode from 'qrcode';
import crypto from 'crypto';

// Generate QR Code
const generateQRCode = async (qrToken: string): Promise<string> => {
  try {
    return await QRCode.toDataURL(qrToken);
  } catch (err) {
    throw new Error('Failed to generate QR code');
  }
};

// Generate unique QR token
const generateQRToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Generate login token URL
const generateLoginToken = (): { token: string; url: string } => {
  const token = crypto.randomBytes(32).toString('hex');
  const url = `${process.env.FRONTEND_URL || 'http://localhost:5174'}/login-link/${token}`;
  return { token, url };
};

// Create User (Student/Worker)
export const createUser = async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).user?._id;
    let { name, email, role, roomNo, jobType, registrationNo } = req.body;

    // Validate input
    if (!name || !role) {
      return res.status(400).json({ message: 'Name and role are required' });
    }

    if (role === 'STUDENT' && !roomNo) {
      return res.status(400).json({ message: 'Room number is required for students' });
    }

    if (role === 'WORKER' && !jobType) {
      return res.status(400).json({ message: 'Job type is required for workers' });
    }

    // Get admin's hostel first to get the domain
    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only admins can create users' });
    }

    const hostel = await Hostel.findById(admin.hostelId);
    if (!hostel) {
      return res.status(500).json({ message: 'Hostel information not found' });
    }

    // Auto-generate email if not provided
    if (!email) {
      if (role === 'STUDENT' && roomNo) {
        email = `${name.toLowerCase().replace(/\s+/g, '_')}_${roomNo.toLowerCase()}@${hostel.domain}`;
      } else if (role === 'WORKER') {
        email = `${name.toLowerCase().replace(/\s+/g, '_')}@${hostel.domain}`;
      } else {
        return res.status(400).json({ message: 'Email is required' });
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    // Generate tokens
    const qrToken = generateQRToken();
    const { token: loginToken, url: loginURL } = generateLoginToken();

    // Create user
    const newUser = new User({
      hostelId: admin.hostelId,
      name,
      email,
      registrationNo,
      role,
      roomNo: role === 'STUDENT' ? roomNo : undefined,
      jobType: role === 'WORKER' ? jobType : undefined,
      qrToken,
      loginURL,
      loginURLExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    await newUser.save();

    // Generate QR code
    const qrCodeDataURL = await generateQRCode(qrToken);

    // Log activity
    await ActivityLog.create({
      userId: adminId,
      action: `Created ${role.toLowerCase()} - ${name} (${email})`,
      ip: req.ip,
    });

    return res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        roomNo: newUser.roomNo,
        jobType: newUser.jobType,
      },
      qrCode: qrCodeDataURL,
      loginURL,
      qrToken,
    });
  } catch (err) {
    const error = err as Error;
    res.status(500).json({ message: error.message });
  }
};

// Get all users for hostel (with filters)
export const getUsers = async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).user?._id;
    const { role, status } = req.query;

    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only admins can view users' });
    }

    const query: any = { hostelId: admin.hostelId, role: { $ne: 'ADMIN' } };

    if (role) {
      query.role = role;
    }

    if (status === 'inactive') {
      query.isActive = false;
    } else if (status === 'active') {
      query.isActive = true;
    }

    const users = await User.find(query).select('-passwordHash -emailVerificationToken');

    return res.status(200).json({ users });
  } catch (err) {
    const error = err as Error;
    res.status(500).json({ message: error.message });
  }
};

// Get single user
export const getUser = async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).user?._id;
    const { userId } = req.params;

    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only admins can view users' });
    }

    const user = await User.findOne({
      _id: userId,
      hostelId: admin.hostelId,
    }).select('-passwordHash -emailVerificationToken');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ user });
  } catch (err) {
    const error = err as Error;
    res.status(500).json({ message: error.message });
  }
};

// Deactivate user
export const deactivateUser = async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).user?._id;
    const { userId } = req.params;

    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only admins can deactivate users' });
    }

    const user = await User.findOne({
      _id: userId,
      hostelId: admin.hostelId,
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = false;
    await user.save();

    // Log activity
    await ActivityLog.create({
      userId: adminId,
      action: `Deactivated user - ${user.name} (${user.email})`,
      ip: req.ip,
    });

    return res.status(200).json({ message: 'User deactivated successfully' });
  } catch (err) {
    const error = err as Error;
    res.status(500).json({ message: error.message });
  }
};

// Reactivate user
export const reactivateUser = async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).user?._id;
    const { userId } = req.params;

    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only admins can reactivate users' });
    }

    const user = await User.findOne({
      _id: userId,
      hostelId: admin.hostelId,
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = true;
    await user.save();

    // Log activity
    await ActivityLog.create({
      userId: adminId,
      action: `Reactivated user - ${user.name} (${user.email})`,
      ip: req.ip,
    });

    return res.status(200).json({ message: 'User reactivated successfully' });
  } catch (err) {
    const error = err as Error;
    res.status(500).json({ message: error.message });
  }
};

// Delete user
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).user?._id;
    const { userId } = req.params;

    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only admins can delete users' });
    }

    const user = await User.findOne({
      _id: userId,
      hostelId: admin.hostelId,
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await User.deleteOne({ _id: userId });

    // Log activity
    await ActivityLog.create({
      userId: adminId,
      action: `Deleted user - ${user.name} (${user.email})`,
      ip: req.ip,
    });

    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    const error = err as Error;
    res.status(500).json({ message: error.message });
  }
};

// Regenerate QR code
export const regenerateQRCode = async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).user?._id;
    const { userId } = req.params;

    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only admins can regenerate QR codes' });
    }

    const user = await User.findOne({
      _id: userId,
      hostelId: admin.hostelId,
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const newQRToken = generateQRToken();
    user.qrToken = newQRToken;
    await user.save();

    const qrCodeDataURL = await generateQRCode(newQRToken);

    // Log activity
    await ActivityLog.create({
      userId: adminId,
      action: `Regenerated QR code for - ${user.name}`,
      ip: req.ip,
    });

    return res.status(200).json({
      message: 'QR code regenerated',
      qrCode: qrCodeDataURL,
      qrToken: newQRToken,
    });
  } catch (err) {
    const error = err as Error;
    res.status(500).json({ message: error.message });
  }
};

// Regenerate login token/URL
export const regenerateLoginToken = async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).user?._id;
    const { userId } = req.params;

    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only admins can regenerate login tokens' });
    }

    const user = await User.findOne({
      _id: userId,
      hostelId: admin.hostelId,
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { token: newToken, url: newLoginURL } = generateLoginToken();
    user.loginURL = newLoginURL;
    user.loginURLExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    // Log activity
    await ActivityLog.create({
      userId: adminId,
      action: `Regenerated login token for - ${user.name}`,
      ip: req.ip,
    });

    return res.status(200).json({
      message: 'Login token regenerated',
      loginURL: newLoginURL,
      expiresIn: '24 hours',
    });
  } catch (err) {
    const error = err as Error;
    res.status(500).json({ message: error.message });
  }
};
