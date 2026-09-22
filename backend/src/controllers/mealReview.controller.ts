import { logger } from '../utils/logger';
import { Request, Response } from 'express';
import { MealReview } from '../models/MealReview';
import { Dish } from '../models/Dish';
import mongoose from 'mongoose';

const VALID_MEALS = ['Breakfast', 'Lunch', 'Snack', 'Dinner'];

export const submitMealReview = async (req: Request, res: Response) => {
    const {
      dishId,
      mealType,
      rating,
      comment,
      servedOn
    } = req.body;

    const { _id: studentId, hostelId } = req.user!;

    // Required fields
    if (!dishId || !mealType || !rating || !servedOn) {
      return res.status(400).json({
        message: 'dishId, mealType, rating, servedOn are required'
      });
    }

    //  Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(dishId)) {
      return res.status(400).json({
        message: 'Invalid dishId'
      });
    }

    // Validate meal type
    if (!VALID_MEALS.includes(mealType)) {
      return res.status(400).json({
        message: 'Invalid meal type'
      });
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        message: 'Rating must be between 1 and 5'
      });
    }

    // Validate servedOn date
    const servedDate = new Date(servedOn);
    if (isNaN(servedDate.getTime())) {
      return res.status(400).json({
        message: 'Invalid servedOn date'
      });
    }

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (servedDate > today) {
      return res.status(400).json({
        message: 'Cannot review a future meal'
      });
    }

    // Validate dish
    const dish = await Dish.findOne({
      _id: dishId,
      hostelId,
      status: 'ACTIVE'
    });

    if (!dish) {
      return res.status(404).json({
        message: 'Dish not found or inactive'
      });
    }

    //  Ensure mealType matches dish
    if (dish.mealType !== mealType) {
      return res.status(400).json({
        message: 'Meal type does not match dish'
      });
    }

    // Prevent duplicate reviews
    const existingReview = await MealReview.findOne({
      hostelId,
      studentId,
      dishId,
      servedOn: servedDate
    });

    if (existingReview) {
      return res.status(409).json({
        message: 'You have already reviewed this meal'
      });
    }

    // Create review
    const review = await MealReview.create({
      hostelId,
      studentId,
      dishId,
      mealType,
      servedOn: servedDate,
      rating,
      comment
    });

    return res.status(201).json({
      message: 'Review submitted successfully',
      reviewId: review._id
    });

};

export const getDishReviews = async (req: Request, res: Response) => {
    return res.status(200).json({ reviews: [] });
};
