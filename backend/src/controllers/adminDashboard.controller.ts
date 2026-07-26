import { Request, Response } from 'express';
import { User } from '../models/User';
import { Dish } from '../models/Dish';
import { Issue } from '../models/Issue';
import { ActivityLog } from '../models/ActivityLog';
import { StudentVote } from '../models/StudentVote';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const hostelId = req.user?.hostelId;
    if (!hostelId) {
      return res.status(400).json({ message: 'Hostel context is required' });
    }

    // 1. Fetch Summary Counts
    const totalStudentsPromise = User.countDocuments({ hostelId, role: 'STUDENT', isActive: true });
    const activeDishesPromise = Dish.countDocuments({ hostelId, status: 'ACTIVE' });
    const openIssuesPromise = Issue.countDocuments({ hostelId, status: { $in: ['OPEN', 'IN_PROGRESS'] } });
    const totalVotesPromise = StudentVote.countDocuments({ hostelId });

    const [totalStudents, activeDishes, openIssues, totalVotes] = await Promise.all([
      totalStudentsPromise,
      activeDishesPromise,
      openIssuesPromise,
      totalVotesPromise
    ]);

    // 2. Fetch Recent Activity Logs for this hostel
    // First find all user IDs in this hostel to filter activity logs
    const usersInHostel = await User.find({ hostelId }).select('_id');
    const userIds = usersInHostel.map(u => u._id);

    const recentActivity = await ActivityLog.find({ userId: { $in: userIds } })
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
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to fetch dashboard stats', error: error.message });
  }
};
