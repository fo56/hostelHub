// student can suggest a new dish 3 time sper week
import { Request, Response } from 'express';
import { Dish } from '../models/Dish';
import { ActivityLog } from '../models/ActivityLog';

export const suggestDish = async (req: Request, res: Response) => {
  try {
    const { name, mealType, category, tags } = req.body;
    const { _id: userId, hostelId } = req.user!;

    if (!name || !mealType || !category) {
      return res.status(400).json({
        message: 'name, mealType, category are required'
      });
    }

    const existingDish = await Dish.findOne({
      hostelId,
      name: { $regex: `^${name}$`, $options: 'i' }
    });

    if (existingDish) {
      return res.status(409).json({
        message: 'Dish already exists in this hostel'
      });
    }

    const dish = await Dish.create({
      hostelId,
      name,
      mealType,
      category,
      tags,
      status: 'UNDER_REVIEW',
      suggestedBy: userId
    });

    await ActivityLog.create({
      userId,
      action: 'SUGGEST_DISH',
      ip: req.ip
    });

    return res.status(201).json({
      message: 'Dish suggestion submitted for review',
      dishId: dish._id
    });
  } catch (error: any) {
    return res.status(500).json({
      message: 'Something went wrong',
      error: error.message
    });
  }
};
