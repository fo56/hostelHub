import { Request, Response } from 'express';
import { MessMenu } from '../models/MessMenu';
import { MenuVoteWindow } from '../models/MenuVoteWindow';
import * as MenuCache from '../services/menuCache.service'
import { formatMeal } from '../utils/formatMeal';
/**
 * GET CURRENT MESS MENU (latest published)
 */
export const getCurrentMessMenu = async (req: Request, res: Response) => {
  try {
    const hostelId = req.user!.hostelId

    const menu = await MenuCache.getCachedCurrentMenu(JSON.stringify(hostelId))

    if (!menu) {
      return res.status(404).json({
        message: 'Mess menu has not been published yet'
      })
    }

    return res.json({
  week: menu.week,
  breakfast: formatMeal(menu.breakfast, menu.week),
  lunch: formatMeal(menu.lunch, menu.week),
  dinner: formatMeal(menu.dinner, menu.week),
  generatedAt: menu.generatedAt
})

  } catch (error: any) {
    return res.status(500).json({
      message: 'Failed to fetch mess menu',
      error: error.message
    })
  }
}

/**
 * CHECK STUDENT VOTING STATUS
 */
export const getStudentVotingStatus = async (req: Request, res: Response) => {
  try {
    const hostelId = req.user!.hostelId;
    const now = new Date();

    const window = await MenuVoteWindow.findOne({ hostelId })
      .sort({ createdAt: -1 });

    if (!window) {
      return res.json({ isOpen: false, week: null });
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

    return res.json({
      isOpen,
      week: window.week
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};


/**
 * GET TODAY'S SERVED DISHES
 */
export const getServedDishesToday = async (req: Request, res: Response) => {
  try {
    const hostelId = req.user!.hostelId

    const todayMenu = await MenuCache.getCachedTodayMenu(JSON.stringify(hostelId))

    if (!todayMenu) {
      return res.status(404).json({
        message: 'No published menu found'
      })
    }

    return res.status(200).json(todayMenu)

  } catch (error: any) {
    return res.status(500).json({
      message: 'Failed to fetch today’s served dishes',
      error: error.message
    })
  }
}