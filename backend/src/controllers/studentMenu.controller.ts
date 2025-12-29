import { Request, Response } from 'express';
import { MessMenu } from '../models/MessMenu';
import { MenuVoteWindow } from '../models/MenuVoteWindow';
/**
 * GET CURRENT MESS MENU (latest published)
 */
export const getCurrentMessMenu = async (req: Request, res: Response) => {
  try {
    const hostelId = req.user!.hostelId;

    const menu = await MessMenu.findOne({
      hostelId,
      published: true
    })
      .sort({ week: -1 }) 
      .populate({
    path: 'breakfast lunch dinner',
    populate: {
      path: 'dishId',
      select: 'name mealType'
    }
  });

    if (!menu) {
      return res.status(404).json({
        message: 'Mess menu has not been published yet'
      });
    }

    return res.status(200).json({
      week: menu.week,
      breakfast: menu.breakfast,
      lunch: menu.lunch,
      dinner: menu.dinner,
      generatedAt: menu.generatedAt
    });

  } catch (error: any) {
    return res.status(500).json({
      message: 'Failed to fetch mess menu',
      error: error.message
    });
  }
};

/**
 * GET MENU FOR A SPECIFIC WEEK
 */
export const getMessMenuByWeek = async (req: Request, res: Response) => {
  try {
    const hostelId = req.user!.hostelId;
    const week = Number(req.params.week);

    if (!week) {
      return res.status(400).json({
        message: 'Invalid week parameter'
      });
    }

    const menu = await MessMenu.findOne({
      hostelId,
      week,
      published: true
    }).populate({
    path: 'breakfast lunch dinner',
    populate: {
      path: 'dishId',
      select: 'name mealType'
    }
  });

    if (!menu) {
      return res.status(404).json({
        message: 'Menu not found for this week'
      });
    }

    return res.status(200).json({
      week: menu.week,
      breakfast: menu.breakfast,
      lunch: menu.lunch,
      dinner: menu.dinner
    });

  } catch (error: any) {
    return res.status(500).json({
      message: 'Failed to fetch menu',
      error: error.message
    });
  }
};

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
    const hostelId = req.user!.hostelId;

    const menu = await MessMenu.findOne({
      hostelId,
      published: true
    })
      .sort({ week: -1 })
      .populate({
        path: 'breakfast lunch dinner',
        populate: {
          path: 'dishId',
          select: 'name mealType'
        }
      });

    if (!menu) {
      return res.status(404).json({
        message: 'No published menu found'
      });
    }

    // JS: Sunday = 0 → convert to Monday = 0
    const jsDay = new Date().getDay(); // 0–6
    const dayIndex = jsDay === 0 ? 6 : jsDay - 1;

    return res.status(200).json({
      date: new Date().toISOString().split('T')[0],
      dayIndex,
      breakfast: menu.breakfast[dayIndex] ?? null,
      lunch: menu.lunch[dayIndex] ?? null,
      dinner: menu.dinner[dayIndex] ?? null
    });

  } catch (error: any) {
    return res.status(500).json({
      message: 'Failed to fetch today’s served dishes',
      error: error.message
    });
  }
};
