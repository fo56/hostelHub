import { Request, Response } from 'express';
import { User } from '../models/User';
import { Dish } from '../models/Dish';
import { Issue } from '../models/Issue';
import { ActivityLog } from '../models/ActivityLog';
import { StudentVote } from '../models/StudentVote';

export const getDashboardStats = async (req: Request, res: Response) => {
    const hostelId = req.user?.hostelId;
    if (!hostelId) {
      return res.status(400).json({ message: 'Hostel context is required' });
    }

    // 1. Fetch Summary Counts
    const totalStudentsPromise = User.countDocuments({ hostelId, role: 'STUDENT', isActive: true });
    const activeDishesPromise = Dish.countDocuments({ hostelId, status: 'ACTIVE' });
    const openIssuesPromise = Issue.countDocuments({ hostelId, status: 'OPEN' });
    const totalVotesPromise = StudentVote.countDocuments({ hostelId });

    const [totalStudents, activeDishes, openIssues, totalVotes] = await Promise.all([
      totalStudentsPromise,
      activeDishesPromise,
      openIssuesPromise,
      totalVotesPromise
    ]);

    // 2. Fetch Recent Activity Logs for this hostel directly via denormalized hostelId
    const recentActivity = await ActivityLog.find({ hostelId })
      .sort({ timestamp: -1 })
      .limit(15)
      .populate('userId', 'name role')
      .lean();

    return res.status(200).json({
      totalStudents,
      activeDishes,
      openIssues,
      totalVotes,
      recentActivity
    });
};
