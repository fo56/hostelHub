import { Request, Response } from 'express';
import { MenuVoteWindow } from '../models/MenuVoteWindow';
import { MessMenu } from '../models/MessMenu';
import { computeMenuRecommendations } from '../services/menuComputation.service';
import { buildMessMenu } from '../services/menuBuilder.service';

// ADMIN: OPEN VOTING WINDOW
export const openVotingWindow = async (req: Request, res: Response) => {
  try {
    const { week, durationInDays } = req.body;
    const hostelId = req.user!.hostelId;
    const adminId = req.user!._id;

    if (!week || !durationInDays) {
      return res.status(400).json({
        message: 'week and durationInDays are required'
      });
    }
    await MenuVoteWindow.updateMany(
      { hostelId, isActive: true },
      { isActive: false }
    );
    const startsAt = new Date();
    const endsAt = new Date();
    endsAt.setDate(startsAt.getDate() + durationInDays);

    const window = await MenuVoteWindow.create({
      hostelId,
      week,
      startsAt,
      endsAt,
      createdBy: adminId,
      isActive: true
    });

    return res.status(201).json({
      message: 'Voting window opened successfully',
      votingWindow: window
    });

  } catch (error: any) {
    return res.status(500).json({
      message: 'Failed to open voting window',
      error: error.message
    });
  }
};

// ADMIN: CLOSE VOTING WINDOW (MANUAL)
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
      { hostelId, week, isActive: true },
      { isActive: false },
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

// ADMIN: GET VOTING STATUS
export const getVotingStatus = async (req: Request, res: Response) => {
  try {
    const hostelId = req.user!.hostelId;
    const now = new Date();
    const weekParam = req.query.week;

    const window = weekParam
      ? await MenuVoteWindow.findOne({
          hostelId,
          week: Number(weekParam)
        })
      : await MenuVoteWindow.findOne({ hostelId }).sort({ createdAt: -1 });

    if (!window) {
      return res.status(200).json({
        isOpen: false,
        ended: true,
        message: 'Voting has not been initialized'
      });
    }

    // Auto-close expired window
    if (window.isActive && window.endsAt < now) {
      window.isActive = false;
      await window.save();
    }

    const isOpen =
      window.isActive &&
      window.startsAt <= now &&
      window.endsAt >= now;

    return res.status(200).json({
      week: window.week,
      isOpen,
      ended: !isOpen,
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

// ADMIN: GENERATE FINAL MESS MENU/
export const generateFinalMenu = async (req: Request, res: Response) => {
  try {
    const hostelId = req.user!.hostelId;
    const now = new Date();

    const window = await MenuVoteWindow.findOne({ hostelId })
      .sort({ createdAt: -1 });

    // No voting window exists
    if (!window) {
      return res.status(400).json({
        message: 'No voting window found. Cannot generate menu.'
      });
    }

    // Voting still open
    if (
      window.isActive &&
      window.startsAt <= now &&
      window.endsAt >= now
    ) {
      return res.status(400).json({
        message: 'Voting is still open. Wait until voting ends.'
      });
    }

    // Prevent duplicate menu generation
    const existingMenu = await MessMenu.findOne({
      hostelId,
      week: window.week
    });

    if (existingMenu) {
      return res.status(400).json({
        message: 'Mess menu already generated for this week'
      });
    }

    // Step 1: Compute recommendations
    await computeMenuRecommendations();

    // Step 2: Build final menu
    const menu = await buildMessMenu(
      hostelId.toString(),
      window.week
    );

    // Step 3: Close voting window (idempotent)
    if (window.isActive) {
      window.isActive = false;
      await window.save();
    }

    return res.status(200).json({
      message: 'Mess menu generated successfully',
      menuId: menu._id
    });

  } catch (error) {
    console.error('Menu generation failed:', error);
    return res.status(500).json({
      message: 'Menu generation failed'
    });
  }
};

// ADMIN: PREVIEW GENERATED MENU (DRAFT)
export const getMenuPreview = async (req: Request, res: Response) => {
  try {
    const hostelId = req.user!.hostelId;

    const menu = await MessMenu.findOne({ hostelId })
      .sort({ createdAt: -1 })
      .populate('breakfast.dishId lunch.dishId dinner.dishId');

    if (!menu) {
      return res.status(404).json({
        message: 'No menu generated yet'
      });
    }

    return res.status(200).json(menu);

  } catch (error: any) {
    return res.status(500).json({
      message: 'Failed to fetch menu preview',
      error: error.message
    });
  }
};

// ADMIN: PUBLISH MENU
export const publishMenu = async (req: Request, res: Response) => {
  try {
    const hostelId = req.user!.hostelId;

    const menu = await MessMenu.findOneAndUpdate(
      { hostelId, published: false },
      { published: true },
      { new: true }
    );

    if (!menu) {
      return res.status(404).json({
        message: 'No unpublished menu found'
      });
    }

    return res.status(200).json({
      message: 'Menu published successfully',
      menuId: menu._id
    });

  } catch (error: any) {
    return res.status(500).json({
      message: 'Failed to publish menu',
      error: error.message
    });
  }
};
