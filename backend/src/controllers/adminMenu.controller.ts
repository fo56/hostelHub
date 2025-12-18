// admin creates a voting window for menu selection
import { Request, Response } from 'express';
import { MenuVoteWindow } from '../models/MenuVoteWindow';

export const openVotingWindow = async (req: Request, res: Response) => {
  try {
    const { week, durationInDays } = req.body;
    const adminId = req.user!._id;
    const hostelId = req.user!.hostelId;

    if (!week || !durationInDays) {
      return res.status(400).json({
        message: 'week and durationInDays are required'
      });
    }

    const startsAt = new Date();
    const endsAt = new Date();
    endsAt.setDate(startsAt.getDate() + durationInDays);

    const window = await MenuVoteWindow.create({
      hostelId,
      week,
      startsAt,
      endsAt,
      createdBy: adminId
    });

    return res.status(201).json({
      message: 'Voting window opened',
      votingWindow: window
    });
  } catch (error: any) {
    return res.status(500).json({
      message: 'Failed to open voting window',
      error: error.message
    });
  }
};
// admin manually closes an active voting window
export const closeVotingWindow = async (req: Request, res: Response) => {
  try {
    const { week } = req.body;
    const hostelId = req.user!.hostelId;

    if (!week) {
      return res.status(400).json({
        message: 'week is required'
      });
    }

    const window = await MenuVoteWindow.findOneAndUpdate(
      {
        hostelId,
        week,
        isActive: true
      },
      {
        isActive: false
      },
      { new: true }
    );

    if (!window) {
      return res.status(404).json({
        message: 'No active voting window found for this week'
      });
    }

    return res.status(200).json({
      message: 'Voting window closed successfully',
      votingWindow: window
    });
  } catch (error: any) {
    return res.status(500).json({
      message: 'Failed to close voting window',
      error: error.message
    });
  }
};
// get voting status for a given week
export const getVotingStatus = async (req: Request, res: Response) => {
  try {
    const { week } = req.query;
    const hostelId = req.user!.hostelId;

    if (!week) {
      return res.status(400).json({
        message: 'week query param is required'
      });
    }

    const now = new Date();

    const window = await MenuVoteWindow.findOne({
      hostelId,
      week: Number(week)
    });

    if (!window) {
      return res.status(200).json({
        isOpen: false,
        message: 'Voting has not been initialized'
      });
    }

    const isOpen =
      window.isActive &&
      window.startsAt <= now &&
      window.endsAt >= now;

    return res.status(200).json({
      week: Number(week),
      isOpen,
      startsAt: window.startsAt,
      endsAt: window.endsAt
    });
  } catch (error: any) {
    return res.status(500).json({
      message: 'Failed to fetch voting status',
      error: error.message
    });
  }
};
