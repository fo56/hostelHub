import { logger } from '../utils/logger';
import { Request, Response } from 'express';
import { Issue } from '../models/Issue';
import { User } from '../models/User';
import { Hostel } from '../models/Hostel';

interface AuthRequest extends Request {
  userId?: string;
  user?: any; // To bypass type checking in this example, but usually typed properly
}

// CREATE ISSUE
export const createIssue = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { category, priority, description } = req.body;
    const userId = req.user?._id;

    if (!category?.trim() || !priority?.trim() || !description?.trim()) {
      res.status(400).json({ message: 'All fields (category, priority, description) are required' });
      return;
    }

    if (!['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(priority.toUpperCase())) {
      res.status(400).json({ message: 'Invalid priority level' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const hostel = await Hostel.findById(user.hostelId);
    if (hostel && hostel.issueCategories && hostel.issueCategories.length > 0) {
      const isValidCategory = hostel.issueCategories.some(c => c.name === category.trim() && c.isActive);
      if (!isValidCategory) {
        res.status(400).json({ message: 'Invalid or inactive issue category selected.' });
        return;
      }
    }

    const issue = new Issue({
      hostelId: user.hostelId,
      raisedBy: userId,
      raisedByName: user.name || user.username || 'Unknown User',
      roomNo: user.roomNo || 'Unknown Room',
      category,
      priority: priority.toUpperCase(),
      description,
      status: 'OPEN'
    });

    await issue.save();

    res.status(201).json({
      message: 'Issue created successfully',
      issue
    });
  } catch (error) {
    logger.error('APP', 'Error creating issue:', error);
    res.status(500).json({ message: 'Failed to create issue' });
  }
};

// GET ALL ISSUES (Admin)
export const getAllIssues = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const issues = await Issue.find({ hostelId: user.hostelId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      issues
    });
  } catch (error) {
    logger.error('APP', 'Error fetching issues:', error);
    res.status(500).json({ message: 'Failed to fetch issues' });
  }
};

// GET MY ISSUES (Student)
export const getMyIssues = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;

    const issues = await Issue.find({ raisedBy: userId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      issues
    });
  } catch (error) {
    logger.error('APP', 'Error fetching user issues:', error);
    res.status(500).json({ message: 'Failed to fetch issues' });
  }
};

// UPDATE ISSUE STATUS (Admin)
export const updateIssueStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { issueId } = req.params;
    const { status, resolverNote } = req.body;
    const userId = req.user?._id;

    if (!['OPEN', 'RESOLVED', 'CLOSED'].includes(status?.toUpperCase())) {
      res.status(400).json({ message: 'Invalid status' });
      return;
    }

    const issue = await Issue.findById(issueId);
    if (!issue) {
      res.status(404).json({ message: 'Issue not found' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const isAdmin = user.role === 'ADMIN';

    if (isAdmin && issue.hostelId.toString() !== user.hostelId.toString()) {
      res.status(403).json({ message: 'Unauthorized to update issues from other hostels' });
      return;
    }

    if (!isAdmin) {
      res.status(403).json({ message: 'Unauthorized to update this issue' });
      return;
    }

    issue.status = status.toUpperCase();
    if (resolverNote) {
      issue.resolverNote = resolverNote;
    }
    await issue.save();

    res.status(200).json({
      message: 'Issue updated successfully',
      issue
    });
  } catch (error) {
    logger.error('APP', 'Error updating issue:', error);
    res.status(500).json({ message: 'Failed to update issue' });
  }
};

// DELETE ISSUE
export const deleteIssue = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { issueId } = req.params;
    const userId = req.user?._id;

    const issue = await Issue.findById(issueId);
    if (!issue) {
      res.status(404).json({ message: 'Issue not found' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const isAdmin = user.role === 'ADMIN';
    const isCreator = issue.raisedBy.toString() === userId?.toString();

    if (isAdmin && issue.hostelId.toString() !== user.hostelId.toString()) {
      res.status(403).json({ message: 'Unauthorized to delete issues from other hostels' });
      return;
    }

    if (!isAdmin && !isCreator) {
      res.status(403).json({ message: 'Unauthorized to delete this issue' });
      return;
    }

    await Issue.findByIdAndDelete(issueId);

    res.status(200).json({ message: 'Issue deleted successfully' });
  } catch (error) {
    logger.error('APP', 'Error deleting issue:', error);
    res.status(500).json({ message: 'Failed to delete issue' });
  }
};

export const getIssueCategories = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const hostel = await Hostel.findById(user.hostelId);
    let categories = ['Other'];
    if (hostel && hostel.issueCategories && hostel.issueCategories.length > 0) {
      categories = hostel.issueCategories.filter((c: any) => c.isActive).map((c: any) => c.name);
    }

    res.status(200).json({ categories });
  } catch (error) {
    logger.error('APP', 'Error fetching categories:', error);
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
};
