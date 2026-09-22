import PDFDocument from 'pdfkit';
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
};

// GET ALL ISSUES (Admin)
export const getAllIssues = async (req: AuthRequest, res: Response): Promise<void> => {
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
};

// GET MY ISSUES (Student)
export const getMyIssues = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user?._id;

    const issues = await Issue.find({ raisedBy: userId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      issues
    });
};

// UPDATE ISSUE STATUS (Admin)
export const updateIssueStatus = async (req: AuthRequest, res: Response): Promise<void> => {
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
};

// DELETE ISSUE
export const deleteIssue = async (req: AuthRequest, res: Response): Promise<void> => {
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
};

export const getIssueCategories = async (req: AuthRequest, res: Response): Promise<void> => {
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
};



export const exportIssuesPdf = async (req: Request, res: Response) => {
    const hostelId = req.user!.hostelId;
    const issues = await Issue.find({ hostelId }).populate('raisedBy', 'name roomNo').sort({ createdAt: -1 });

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=issues-report.pdf');
    doc.pipe(res);

    doc.fontSize(20).text('Issues Report', { align: 'center' }).moveDown();

    issues.forEach(issue => {
        doc.fontSize(12).text(`Category: ${issue.category}`);
        doc.fontSize(10).text(`Status: ${issue.status}`);
        doc.fontSize(10).text(`Description: ${issue.description}`);
        doc.fontSize(10).text(`Reported By: ${(issue.raisedBy as any)?.name || issue.raisedByName} (Room: ${(issue.raisedBy as any)?.roomNo || issue.roomNo})`);
        doc.moveDown();
    });

    doc.end();
};
