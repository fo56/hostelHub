import { Request, Response } from 'express';
import { Dish } from '../models/Dish';
import { ActivityLog } from '../models/ActivityLog';

// Admin can suggest/add a dish directly
export const createAdminDish = async (req: Request, res: Response) => {
  try {
    const { name, mealType, category, tags, priceScore, healthScore } = req.body;
    const adminId = req.user?._id;
    const hostelId = req.user?.hostelId;

    if (!adminId || !hostelId) {
      return res.status(400).json({ message: 'User context missing' });
    }

    if (!name || !mealType || !category) {
      return res.status(400).json({ message: 'Name, mealType, and category are required' });
    }

    const existingDish = await Dish.findOne({
      hostelId,
      name: { $regex: `^${name}$`, $options: 'i' }
    });

    if (existingDish) {
      return res.status(409).json({ message: 'Dish already exists in this hostel' });
    }

    const validPriceScore = typeof priceScore === 'number' && priceScore >= 1 && priceScore <= 5 ? priceScore : 3;
    const validHealthScore = typeof healthScore === 'number' && healthScore >= 1 && healthScore <= 5 ? healthScore : 3;

    const dish = await Dish.create({
      hostelId,
      name,
      mealType,
      category,
      tags: tags || [],
      status: 'ACTIVE', 
      priceScore: validPriceScore,
      healthScore: validHealthScore,
      suggestedBy: adminId,
      approvedBy: adminId
    });

    await ActivityLog.create({
      userId: adminId,
      action: `ADMIN_CREATED_DISH:${dish.name}`,
      ip: req.ip
    });

    return res.status(201).json({ message: 'Dish created and activated successfully', dish });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to create dish', error: error.message });
  }
};

// Student can suggest a new dish 3 times per week
export const suggestDish = async (req: Request, res: Response) => {
  try {
    const { name, mealType, category, tags } = req.body;
    const { _id: userId, hostelId } = req.user!;

    if (!name || !mealType || !category) {
      return res.status(400).json({ message: 'name, mealType, category are required' });
    }

    const existingDish = await Dish.findOne({
      hostelId,
      name: { $regex: `^${name}$`, $options: 'i' }
    });

    if (existingDish) {
      return res.status(409).json({ message: 'Dish already exists in this hostel' });
    }

    const dish = await Dish.create({
      hostelId,
      name,
      mealType,
      category,
      tags: tags || [],
      status: 'UNDER_REVIEW',
      suggestedBy: userId
    });

    await ActivityLog.create({
      userId,
      action: 'SUGGEST_DISH',
      ip: req.ip
    });

    return res.status(201).json({ message: 'Dish suggestion submitted for review', dishId: dish._id });
  } catch (error: any) {
    return res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};