// middlewares/ensureVotingOpen.ts
import { Request, Response, NextFunction } from 'express';
import { MenuVoteWindow } from '../models/MenuVoteWindow';

export const ensureVotingOpen = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const hostelId = req.user!.hostelId;
  const now = new Date();

  // Find an active voting window for the hostel
  const window = await MenuVoteWindow.findOne({
    hostelId,
    isActive: true,
    startsAt: { $lte: now },
    endsAt: { $gte: now }
  }).sort({ createdAt: -1 });

  if (!window) {
    return res.status(403).json({
      message: 'Voting is not open at this time'
    });
  }

  // Attach window to request for later use
  (req as any).votingWindow = window;

  next();
};
