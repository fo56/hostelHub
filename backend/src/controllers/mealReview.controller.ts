import { Request, Response } from 'express';
import { MealReview } from '../models/MealReview';
import { Dish } from '../models/Dish';
import mongoose from 'mongoose';

export const submitMealReview = async (req: Request, res: Response) => {
  try {
    const { dishId, mealType, rating, comment, images, servedOn } = req.body;
    const { _id: studentId, hostelId } = req.user!;

        if (!dishId || !mealType || !rating || !servedOn) {
    return res.status(400).json({
        message: 'dishId, mealType, rating, servedOn are required'
    });
    }

    if (!mongoose.Types.ObjectId.isValid(dishId)) {
    return res.status(400).json({
        message: 'Invalid dishId format'
    });
    }


    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        message: 'Rating must be between 1 and 5'
      });
    }

    // Validate dish belongs to hostel
    const dish = await Dish.findOne({
      _id: dishId,
      hostelId,
      status: 'ACTIVE'
    });

    if (!dish) {
      return res.status(400).json({
        message: 'Invalid dish'
      });
    }

    const review = await MealReview.create({
      hostelId,
      studentId,
      dishId,
      mealType,
      servedOn: new Date(servedOn),
      rating,
      comment,
      images
    });

    return res.status(201).json({
      message: 'Review submitted successfully',
      reviewId: review._id
    });

  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'You have already reviewed this meal'
      });
    }

    return res.status(500).json({
      message: 'Failed to submit review',
      error: error.message
    });
  }
};
