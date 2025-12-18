// student can suggest a new dish 3 times per week
import { Request, Response, NextFunction } from 'express';
import { Dish } from '../models/Dish';

export const dishSuggestionRateLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const count = await Dish.countDocuments({
    suggestedBy: req.user!._id,
    createdAt: { $gte: oneWeekAgo }
  });

  if (count >= 3) {
    return res.status(429).json({
      message: 'Maximum 3 dish suggestions allowed per week'
    });
  }

  next();
};
