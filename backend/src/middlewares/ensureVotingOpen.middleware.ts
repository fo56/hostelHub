// ensures that voting is currently open for the specified week
import { Request, Response, NextFunction } from 'express';
import { MenuVoteWindow } from '../models/MenuVoteWindow';

export const ensureVotingOpen = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { week } = req.body;
  const hostelId = req.user!.hostelId;

  const now = new Date();

  const window = await MenuVoteWindow.findOne({
    hostelId,
    week,
    isActive: true,
    startsAt: { $lte: now },
    endsAt: { $gte: now }
  });

  if (!window) {
    return res.status(403).json({
      message: 'Voting is not open at this time'
    });
  }

  next();
};
