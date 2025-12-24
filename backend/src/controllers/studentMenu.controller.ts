// controllers/studentMenu.controller.ts
import { Request, Response } from 'express';
import { MessMenu } from '../models/MessMenu';
import { MenuVoteWindow } from '../models/MenuVoteWindow';

// GET CURRENT MESS MENU
export const getCurrentMessMenu = async (req: Request, res: Response) => {
  try {
    const hostelId = req.user!.hostelId;

    const menu = await MessMenu.findOne({
      hostelId,
      published: true
    })
      .sort({ generatedAt: -1 })
      .populate('breakfast.dishId lunch.dishId dinner.dishId');

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

// GET MENU FOR A SPECIFIC WEEK 
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
    }).populate('breakfast.dishId lunch.dishId dinner.dishId');

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

// CHECK VOTING STATUS (READ-ONLY)
export const getStudentVotingStatus = async (req: Request, res: Response) => {
  try {
    const hostelId = req.user!.hostelId;
    const now = new Date();

    const window = await MenuVoteWindow.findOne({ hostelId })
      .sort({ createdAt: -1 });

    if (!window) {
      return res.status(200).json({
        isOpen: false,
        message: 'Voting not started'
      });
    }

    const isOpen =
      window.isActive &&
      window.startsAt <= now &&
      window.endsAt >= now;

    return res.status(200).json({
      week: window.week,
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
// GET TODAY'S SERVED DISHES
export const getServedDishesToday = async (req: Request, res: Response) => {
  try {
    const hostelId = req.user!.hostelId;

    const menu = await MessMenu.findOne({
      hostelId,
      published: true
    })
      .sort({ createdAt: -1 })
      .populate('breakfast.dishId lunch.dishId dinner.dishId');

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
