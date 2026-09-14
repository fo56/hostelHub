import { logger } from '../utils/logger';
import { Request, Response } from 'express';
import { MessMenu } from '../models/MessMenu';
import { StudentVote } from '../models/StudentVote';
import { User } from '../models/User';
import * as ComputationService from '../services/menuComputation.service';
import * as BuilderService from '../services/menuBuilder.service';

/**
 * ADMIN: GET LIVE VOTING STATS
 */
export const getVotingStats = async (req: Request, res: Response) => {
  try {
    const hostelId = req.user!.hostelId;
    const totalVoters = await StudentVote.countDocuments({ hostelId });
    const totalStudents = await User.countDocuments({ hostelId, role: 'STUDENT' });
    const requestsNewMenu = await StudentVote.countDocuments({ hostelId, wantsNewMenu: true });

    return res.status(200).json({
      totalVoters,
      totalStudents,
      requestsNewMenu
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

    // Build menu (saved as draft by default)
    const menu = await BuilderService.buildMessMenu(hostelId.toString(), false, 'MANUAL');


    return res.status(200).json({
      message: 'Mess menu generated successfully based on active votes',
      menuId: menu._id
    });
  } catch (error: any) {
    logger.error('APP', 'Menu generation failed:', error);
    return res.status(500).json({ message: 'Menu generation failed', error: error.message });
  }
};

/**
 * ADMIN: GET MENU PREVIEW
 */
export const getMenuPreview = async (req: Request, res: Response) => {
  try {
    const hostelId = req.user!.hostelId;
    const menu = await MessMenu.findOne({ hostelId })
      .sort({ createdAt: -1 })
      .populate('meals.slots.fixedItems')
      .populate({ 
        path: 'meals.slots.rotatingItems.item', 
        populate: { path: 'dishId' } 
      });

    if (!menu) {
      return res.status(200).json(null);
    }

    return res.status(200).json(menu);
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to fetch menu preview', error: error.message });
  }
};

/**
 * ADMIN: PUBLISH MENU
 */
export const publishMenu = async (req: Request, res: Response) => {
  try {
    const hostelId = req.user!.hostelId;
    const menu = await MessMenu.findOne({ hostelId }).sort({ weekOf: -1 });
    if (!menu) return res.status(404).json({ message: 'No menu found to publish' });

    menu.published = true;
    menu.publishedAt = new Date();
    await menu.save();

    // Reset student requests for a new menu when finally published
    await StudentVote.updateMany({ hostelId }, { wantsNewMenu: false });

    return res.status(200).json({ message: 'Menu published successfully' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to publish menu', error: error.message });
  }
};

/**
 * ADMIN: UPDATE MENU (Save Edits)
 */
export const updateMenu = async (req: Request, res: Response) => {
  try {
    const hostelId = req.user!.hostelId;
    const { meals } = req.body;
    
    if (!meals) return res.status(400).json({ message: 'Meals payload is required' });

    const menu = await MessMenu.findOne({ hostelId }).sort({ weekOf: -1 });
    if (!menu) return res.status(404).json({ message: 'No menu found to update' });

    menu.meals = meals;
    await menu.save();

    return res.status(200).json({ message: 'Menu updated successfully' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to update menu', error: error.message });
  }
};