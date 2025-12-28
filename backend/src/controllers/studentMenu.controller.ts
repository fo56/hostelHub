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
      .populate('breakfast lunch dinner');

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
    }).populate('breakfast lunch dinner');

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
    // 1. Fetch the actual setting from your Database
    // Replace 'VotingModel' with your actual model name
    const window = await MenuVoteWindow.findOne({ isActive: true }); 

    if (!window) {
      return res.json({ isOpen: false, week: null });
    }

    // 2. Return the format the frontend expects
    return res.json({
      isOpen: window.isActive, // Must be true
      week: window.week
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
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
      .sort({ generatedAt: -1 }) 
      .populate('breakfast lunch dinner');

    if (!menu) {
      return res.status(404).json({
        message: 'No published menu found'
      });
    }

    const today = new Date().toISOString().split('T')[0];

    return res.status(200).json({
      date: today,
      breakfast: menu.breakfast,
      lunch: menu.lunch,
      dinner: menu.dinner
    });

  } catch (error: any) {
    return res.status(500).json({
      message: 'Failed to fetch today’s served dishes',
      error: error.message
    });
  }
};
