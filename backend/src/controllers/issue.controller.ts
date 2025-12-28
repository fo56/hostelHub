import { Request, Response } from 'express';
import { Issue } from '../models/Issue';
import { User } from '../models/User';

// Define AuthRequest type inline
interface AuthRequest extends Request {
  userId?: string;
}

// CREATE ISSUE - Student raises an issue
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

    const issue = new Issue({
      hostelId: user.hostelId,
      raisedBy: userId,
      category,
      priority: priority.toUpperCase(),
      description,
      status: 'OPEN'
    });

    await issue.save();
    await issue.populate('raisedBy', 'name email');

    res.status(201).json({
      message: 'Issue created successfully',
      issue
    });
  } catch (error) {
    console.error('Error creating issue:', error);
    res.status(500).json({ message: 'Failed to create issue' });
  }
};

// GET ALL ISSUES - Admin views all issues in their hostel
export const getAllIssues = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const issues = await Issue.find({ hostelId: user.hostelId })
      .populate('raisedBy', 'name email rollNumber hostelId')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      issues
    });
  } catch (error) {
    console.error('Error fetching issues:', error);
    res.status(500).json({ message: 'Failed to fetch issues' });
  }
};

// GET MY ISSUES - Student views their own issues
export const getMyIssues = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;

    const issues = await Issue.find({ raisedBy: userId })
      .populate('raisedBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      issues
    });
  } catch (error) {
    console.error('Error fetching user issues:', error);
    res.status(500).json({ message: 'Failed to fetch issues' });
  }
};

// GET ASSIGNED ISSUES - Worker views issues assigned to them
export const getAssignedIssues = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const workerId = req.user?._id;

    const issues = await Issue.find({ assignedTo: workerId })
      .populate('raisedBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      issues
    });
  } catch (error) {
    console.error('Error fetching assigned issues:', error);
    res.status(500).json({ message: 'Failed to fetch assigned issues' });
  }
};

// ASSIGN ISSUE - Admin assigns issue to a worker
export const assignIssue = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { issueId } = req.params;
    const { workerId } = req.body;
    const adminId = req.user?._id;

    if (!workerId?.trim()) {
      res.status(400).json({ message: 'Worker ID is required' });
      return;
    }

    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'ADMIN') {
      res.status(403).json({ message: 'Unauthorized: Only admins can assign issues' });
      return;
    }

    const issue = await Issue.findById(issueId);
    if (!issue) {
      res.status(404).json({ message: 'Issue not found' });
      return;
    }

    if (issue.hostelId.toString() !== admin.hostelId.toString()) {
      res.status(403).json({ message: 'Unauthorized: Cannot assign issues from other hostels' });
      return;
    }

    const worker = await User.findById(workerId);
    if (!worker || worker.role !== 'WORKER' || worker.hostelId.toString() !== admin.hostelId.toString()) {
      res.status(404).json({ message: 'Worker not found in this hostel' });
      return;
    }

    issue.assignedTo = worker._id;
    issue.status = 'IN_PROGRESS';
    await issue.save();
    await issue.populate('raisedBy', 'name email');
    await issue.populate('assignedTo', 'name email');

    res.status(200).json({
      message: 'Issue assigned successfully',
      issue
    });
  } catch (error) {
    console.error('Error assigning issue:', error);
    res.status(500).json({ message: 'Failed to assign issue' });
  }
};

// UPDATE ISSUE STATUS
export const updateIssueStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { issueId } = req.params;
    const { status, resolverNote } = req.body;
    const userId = req.user?._id;

    if (!['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(status?.toUpperCase())) {
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

    // Allow worker assigned to this issue or admin to update status
    const isAssignedWorker = issue.assignedTo?.toString() === userId;
    const isAdmin = user.role === 'ADMIN';

    if (!isAssignedWorker && !isAdmin) {
      res.status(403).json({ message: 'Unauthorized to update this issue' });
      return;
    }

    issue.status = status.toUpperCase();
    if (resolverNote) {
      issue.resolverNote = resolverNote;
    }
    issue.updatedAt = new Date();
    await issue.save();
    await issue.populate('raisedBy', 'name email');
    await issue.populate('assignedTo', 'name email');

    res.status(200).json({
      message: 'Issue updated successfully',
      issue
    });
  } catch (error) {
    console.error('Error updating issue:', error);
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

    // Only admin or the person who raised the issue can delete it
    const isAdmin = user.role === 'ADMIN';
    const isCreator = issue.raisedBy.toString() === userId?.toString();

    if (!isAdmin && !isCreator) {
      res.status(403).json({ message: 'Unauthorized to delete this issue' });
      return;
    }

    await Issue.findByIdAndDelete(issueId);

    res.status(200).json({ message: 'Issue deleted successfully' });
  } catch (error) {
    console.error('Error deleting issue:', error);
    res.status(500).json({ message: 'Failed to delete issue' });
  }
};
