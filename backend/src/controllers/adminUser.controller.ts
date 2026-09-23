import { Request, Response } from 'express';
import { User } from '../models/User';
import { ActivityLog } from '../models/ActivityLog';
import { Hostel } from '../models/Hostel';
import crypto from 'crypto';
import { StudentVote } from '../models/StudentVote';
import { MealReview } from '../models/MealReview';
import { Issue } from '../models/Issue';
import { RefreshToken } from '../models/RefreshToken';
import { Dish } from '../models/Dish';
import { asyncHandler } from '../utils/asyncHandler';

// generate simple password
const generatePassword = (): string => {
  return crypto.randomBytes(4).toString('hex'); // 8 char hex
};

// Create User (Student/Worker)
export const createUser = async (req: Request, res: Response) => {
    const adminId = (req as any).user?._id;
    let { username, password, name, role, roomNo, permissions } = req.body;

    if (!role) {
      return res.status(400).json({ message: 'Role is required' });
    }

    if (role === 'STUDENT' && !roomNo && !username) {
      return res.status(400).json({ message: 'Room number is required for students if username is not provided' });
    }

    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only admins can create users' });
    }

    const hostel = await Hostel.findById(admin.hostelId);
    if (!hostel) {
      return res.status(500).json({ message: 'Hostel information not found' });
    }

    // Generate or format username
    if (username) {
      const suffix = `@${hostel.domain}`;
      if (!username.endsWith(suffix)) {
        username = `${username}${suffix}`;
      }
    } else {
      if (role === 'STUDENT') {
         const existingInRoom = await User.countDocuments({ hostelId: hostel._id, roomNo });
         const nextId = existingInRoom + 1;
         username = `${roomNo}.${nextId}@${hostel.domain}`;
      } else if (role === 'ADMIN') {
         const existingAdmins = await User.countDocuments({ hostelId: hostel._id, role: 'ADMIN' });
         const nextId = existingAdmins + 1;
         username = nextId === 1 ? `admin@${hostel.domain}` : `admin${nextId}@${hostel.domain}`;
      } else {
         return res.status(400).json({ message: 'Username is required' });
      }
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ message: 'Generated username already exists' });
    }

    const rawPassword = password || generatePassword();
    const bcrypt = require('bcrypt');
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    const newUser = new User({
      hostelId: admin.hostelId,
      name,
      username,
      role,
      roomNo,
      permissions: role === 'ADMIN' ? permissions : [],
      passwordHash
    });

    await newUser.save();

    await ActivityLog.create({
      hostelId: admin.hostelId,
      userId: adminId,
      action: `Created student - ${name || username} (${username})`,});

    return res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser._id,
        name: newUser.name,
        username: newUser.username,
        role: newUser.role,
        roomNo: newUser.roomNo,
      },
      rawPassword
    });
};

// Bulk Create Users
export const bulkCreateUsers = async (req: Request, res: Response) => {
    const adminId = (req as any).user?._id;
    const { users } = req.body; // Array of { username, password, name?, role, roomNo? }

    if (!Array.isArray(users)) {
      return res.status(400).json({ message: 'Users must be an array' });
    }

    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only admins can bulk create users' });
    }

    const hostel = await Hostel.findById(admin.hostelId);
    if (!hostel) {
      return res.status(500).json({ message: 'Hostel information not found' });
    }

    const createdUsers = [];
    const bcrypt = require('bcrypt');

    for (const u of users) {
      let { username, password, name, role, roomNo, permissions } = u;
      
      // Generate or format username
      if (username) {
        const suffix = `@${hostel.domain}`;
        if (!username.endsWith(suffix)) {
          username = `${username}${suffix}`;
        }
      } else {
        if (role === 'STUDENT' && roomNo) {
          const existingInRoom = await User.countDocuments({ hostelId: hostel._id, roomNo });
          const nextId = existingInRoom + 1;
          username = `${roomNo}.${nextId}@${hostel.domain}`;
        } else if (role === 'ADMIN') {
          const existingAdmins = await User.countDocuments({ hostelId: hostel._id, role: 'ADMIN' });
          const nextId = existingAdmins + 1;
          username = nextId === 1 ? `admin@${hostel.domain}` : `admin${nextId}@${hostel.domain}`;
        } else {
          continue; // skip invalid user
        }
      }

      const existingUser = await User.findOne({ username });
      if (existingUser) continue; // skip duplicates

      const rawPassword = password || generatePassword();
      const passwordHash = await bcrypt.hash(rawPassword, 10);

      const newUser = new User({
        hostelId: admin.hostelId,
        name,
        username,
        role: role || 'STUDENT',
        roomNo,
        permissions: role === 'ADMIN' ? permissions : [],
        passwordHash
      });

      await newUser.save();
      createdUsers.push({
        username: newUser.username,
        rawPassword,
        name: newUser.name,
        role: newUser.role,
        roomNo: newUser.roomNo
      });
    }

    await ActivityLog.create({
      hostelId: admin.hostelId,
      userId: adminId,
      action: `Bulk created ${createdUsers.length} users`,});

    return res.status(201).json({
      message: `${createdUsers.length} users created successfully`,
      createdUsers
    });
};

// Get all users for hostel (with filters)
export const getUsers = async (req: Request, res: Response) => {
    const adminId = (req as any).user?._id;
    const { role, status } = req.query;

    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only admins can view users' });
    }

    const query: any = { hostelId: admin.hostelId };
    if (role) query.role = role;
    if (status === 'inactive') query.isActive = false;
    else if (status === 'active') query.isActive = true;

    const users = await User.find(query).select('-passwordHash -emailVerificationToken');
    return res.status(200).json({ users });
};

// Get single user
export const getUser = async (req: Request, res: Response) => {
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
};

// Deactivate user
export const deactivateUser = async (req: Request, res: Response) => {
    const adminId = (req as any).user?._id;
    const { userId } = req.params;

    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only admins can deactivate users' });
    }

    const user = await User.findOne({ _id: userId, hostelId: admin.hostelId }).populate('hostelId');
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const hostel = user.hostelId as any;
    if (user.role === 'ADMIN' && user.username === `admin@${hostel.domain}`) {
      return res.status(403).json({ message: 'The primary admin cannot be deactivated' });
    }

    user.isActive = false;
    await user.save();

    await ActivityLog.create({
      hostelId: admin.hostelId,
      userId: adminId,
      action: `Deactivated user - ${user.name} (${user.username})`,});

    return res.status(200).json({ message: 'User deactivated successfully' });
};

// Reactivate user
export const reactivateUser = async (req: Request, res: Response) => {
    const adminId = (req as any).user?._id;
    const { userId } = req.params;

    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only admins can reactivate users' });
    }

    const user = await User.findOne({ _id: userId, hostelId: admin.hostelId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isActive = true;
    await user.save();

    await ActivityLog.create({
      hostelId: admin.hostelId,
      userId: adminId,
      action: `Reactivated user - ${user.name} (${user.username})`,});

    return res.status(200).json({ message: 'User reactivated successfully' });
};

// Delete user
export const deleteUser = async (req: Request, res: Response) => {
    const adminId = (req as any).user?._id;
    const { userId } = req.params;

    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only admins can delete users' });
    }

    const user = await User.findOne({ _id: userId, hostelId: admin.hostelId }).populate('hostelId');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const hostel = user.hostelId as any;
    if (user.role === 'ADMIN' && user.username === `admin@${hostel.domain}`) {
      return res.status(403).json({ message: 'The primary admin cannot be deleted' });
    }

    await Promise.all([
      StudentVote.deleteMany({ userId }),
      RefreshToken.deleteMany({ userId }),
    ]);

    await User.deleteOne({ _id: userId });

    await ActivityLog.create({
      hostelId: admin.hostelId,
      userId: adminId,
      action: `Deleted user - ${user.name} (${user.username}) and all associated records`,});

    return res.status(200).json({ message: 'User and all associated records deleted successfully' });
};

// TOKEN REGENERATION ROUTES DELETED

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, roomNo, permissions } = req.body;
    const userToUpdate = await User.findById(id);
    if (!userToUpdate) return res.status(404).json({ message: 'User not found' });

    if (name !== undefined) userToUpdate.name = name;
    if (permissions !== undefined) userToUpdate.permissions = permissions;
    
    if (roomNo !== undefined && userToUpdate.role === 'STUDENT') {
        userToUpdate.roomNo = roomNo;
    }

    await userToUpdate.save();
    return res.status(200).json({ user: userToUpdate });
});
