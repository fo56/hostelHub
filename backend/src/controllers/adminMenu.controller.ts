import { Request, Response } from 'express';
import { MessMenu } from '../models/MessMenu';
import { StudentVote } from '../models/StudentVote';
import * as ComputationService from '../services/menuComputation.service';
import * as BuilderService from '../services/menuBuilder.service';
import * as MenuCache from '../services/menuCache.service';
import { getIO } from '../services/socket.service';

/**
 * ADMIN: GET LIVE VOTING STATS
 */
export const getVotingStats = async (req: Request, res: Response) => {
  try {
    const hostelId = req.user!.hostelId;
    const totalVoters = await StudentVote.countDocuments({ hostelId });

    return res.status(200).json({
      totalVoters
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to fetch stats', error: error.message });
  }
};

/**
 * ADMIN: GENERATE FINAL MENU DIRECTLY
 */
export const generateFinalMenu = async (req: Request, res: Response) => {
  try {
    const hostelId = req.user!.hostelId;

    // Compute recommendations based on active student preference pool
    await ComputationService.computeMenuRecommendations(hostelId.toString());

    // Build draft menu
    const menu = await BuilderService.buildMessMenu(hostelId.toString());

    return res.status(200).json({
      message: 'Mess menu generated successfully based on active votes',
      menuId: menu._id
    });
  } catch (error: any) {
    console.error('Menu generation failed:', error);
    return res.status(500).json({ message: 'Menu generation failed', error: error.message });
  }
};

/**
 * ADMIN: PUBLISH MENU (Broadcasts event to students)
 */
export const publishMenu = async (req: Request, res: Response) => {
  try {
    const hostelId = req.user!.hostelId;

    const menu = await MessMenu.findOneAndUpdate(
      { hostelId, published: false },
      { published: true },
      { new: true }
    );

    if (!menu) {
      return res.status(404).json({ message: 'No unpublished menu found' });
    }

    await MenuCache.invalidateMenuCache(hostelId.toString());

    // Notify all connected students in the hostel that a new menu is live
    getIO().to(`hostel_${hostelId}`).emit('MENU_PUBLISHED', {
      publishedAt: new Date()
    });

    return res.status(200).json({
      message: 'Menu published successfully',
      menuId: menu._id
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to publish menu', error: error.message });
  }
};

export const getMenuPreview = async (req: Request, res: Response) => {
  try {
    const hostelId = req.user!.hostelId;
    const menu = await MessMenu.findOne({ hostelId }).populate({
      path: 'breakfast lunch dinner',
      populate: {
        path: 'dishId',
        select: 'name mealType priceScore healthScore'
      }
    });

    if (!menu) {
      return res.status(200).json(null);
    }

    return res.status(200).json(menu);
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to fetch menu preview', error: error.message });
  }
};