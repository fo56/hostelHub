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
    const hostelId = req.user!.hostelId;
    const totalVoters = await StudentVote.countDocuments({ hostelId });
    const totalStudents = await User.countDocuments({ hostelId, role: 'STUDENT' });
    const requestsNewMenu = await StudentVote.countDocuments({ hostelId, wantsNewMenu: true });

    return res.status(200).json({
      totalVoters,
      totalStudents,
      requestsNewMenu
    });
};

/**
 * ADMIN: GENERATE FINAL MENU DIRECTLY
 */
export const generateFinalMenu = async (req: Request, res: Response) => {
    const hostelId = req.user!.hostelId;

    // Compute recommendations based on active student preference pool
    await ComputationService.computeMenuRecommendations(hostelId.toString());

    // Build menu (saved as draft by default)
    const menu = await BuilderService.buildMessMenu(hostelId.toString(), 'Standard', 'MANUAL');


    return res.status(200).json({
      message: 'Mess menu generated successfully based on active votes',
      menuId: menu._id
    });
};

/**
 * ADMIN: GET MENU PREVIEW
 */
export const getMenuPreview = async (req: Request, res: Response) => {
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
};

/**
 * ADMIN: PUBLISH MENU
    return res.status(200).json({ message: 'Menu published successfully' });
};

/**
 * ADMIN: UPDATE MENU (Save Edits)
 */
export const updateMenu = async (req: Request, res: Response) => {
    const hostelId = req.user!.hostelId;
    const { meals } = req.body;
    
    if (!meals) return res.status(400).json({ message: 'Meals payload is required' });

    const menu = await MessMenu.findOne({ hostelId }).sort({ weekOf: -1 });
    if (!menu) return res.status(404).json({ message: 'No menu found to update' });

    menu.meals = meals;
    await menu.save();

    return res.status(200).json({ message: 'Menu updated successfully' });
};
export const getMenuHistory = async (req: Request, res: Response) => {
    return res.status(200).json([]);
};

export const deleteMenu = async (req: Request, res: Response) => {
    return res.status(200).json({ message: 'Menu deleted' });
};

export const publishMenu = async (req: Request, res: Response) => {
    const hostelId = req.user!.hostelId;
    const menu = await MessMenu.findOne({ hostelId }).sort({ weekOf: -1 });
    if (!menu) return res.status(404).json({ message: 'No menu found' });
    menu.status = 'PUBLISHED';
    menu.publishedAt = new Date();
    await menu.save();
    await StudentVote.updateMany({ hostelId }, { wantsNewMenu: false });
    return res.status(200).json({ message: 'Published' });
};
