import { logger } from '../utils/logger';
import { Request, Response } from 'express';
import { MessMenu } from '../models/MessMenu';
import { StudentVote } from '../models/StudentVote';
import { User } from '../models/User';
import { ActivityLog } from '../models/ActivityLog';
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
    await MessMenu.deleteMany({ hostelId, status: 'DRAFT' });
    await ComputationService.computeMenuRecommendations(hostelId.toString());

    // Build multiple menu variants (saved as draft by default)
    const menuStandard = await BuilderService.buildMessMenu(hostelId.toString(), 'Standard', 'MANUAL');
    const menuLowRep = await BuilderService.buildMessMenu(hostelId.toString(), 'Low Repetition', 'MANUAL');


    await ActivityLog.create({
      hostelId,
      userId: req.user!._id,
      action: `GENERATED_MENU_VARIANTS`,
    });

    return res.status(200).json({
      message: 'Mess menu variants generated successfully',
      menuIds: [menuStandard._id, menuLowRep._id]
    });
};

/**
 * ADMIN: GET MENU PREVIEW
 */
export const getMenuPreview = async (req: Request, res: Response) => {
    const hostelId = req.user!.hostelId;
    const draftMenus = await MessMenu.find({ hostelId, status: 'DRAFT' })
      .sort({ createdAt: -1 })
      .populate('meals.slots.fixedItems')
      .populate('meals.slots.rotatingItems.item');

    if (draftMenus && draftMenus.length > 0) {
      return res.status(200).json(draftMenus);
    }

    const latestMenu = await MessMenu.findOne({ hostelId })
      .sort({ createdAt: -1 })
      .populate('meals.slots.fixedItems')
      .populate('meals.slots.rotatingItems.item');

    if (!latestMenu) {
      return res.status(200).json(null);
    }

    return res.status(200).json([latestMenu]);
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
    
    await ActivityLog.create({
      hostelId,
      userId: req.user!._id,
      action: `UPDATED_MENU:${menu.variantLabel || 'Current'}`,
    });

    return res.status(200).json({ message: 'Menu updated successfully' });
};
export const getMenuHistory = async (req: Request, res: Response) => {
    const hostelId = req.user!.hostelId;
    const history = await MessMenu.find({ hostelId, status: { $in: ['PUBLISHED', 'ARCHIVED'] } })
      .sort({ createdAt: -1 })
      .populate('meals.slots.fixedItems')
      .populate('meals.slots.rotatingItems.item');
    return res.status(200).json(history);
};

export const deleteMenu = async (req: Request, res: Response) => {
    const hostelId = req.user!.hostelId;
    await MessMenu.deleteOne({ _id: req.params.id, hostelId });
    
    await ActivityLog.create({
      hostelId,
      userId: req.user!._id,
      action: `DELETED_MENU:${req.params.id}`,
    });
    return res.status(200).json({ message: 'Menu deleted' });
};

export const publishMenu = async (req: Request, res: Response) => {
    const hostelId = req.user!.hostelId;
    const { menuId } = req.body;
    const menu = await MessMenu.findOne({ _id: menuId, hostelId });
    if (!menu) return res.status(404).json({ message: 'No menu found' });
    menu.status = 'PUBLISHED';
    menu.publishedAt = new Date();
    await menu.save();
    
    // Archive other drafts
    await MessMenu.updateMany(
        { hostelId, status: 'DRAFT', _id: { $ne: menuId } },
        { $set: { status: 'ARCHIVED' } }
    );
    
    await StudentVote.updateMany({ hostelId }, { $set: { wantsNewMenu: false } });

    await ActivityLog.create({
      hostelId,
      userId: req.user!._id,
      action: `PUBLISHED_MENU:${menu.variantLabel || 'Current'}`,
    });

    return res.status(200).json({ message: 'Published' });
};
