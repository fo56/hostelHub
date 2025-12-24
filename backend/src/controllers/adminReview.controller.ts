import { Request, Response } from 'express';
import { MealReview } from '../models/MealReview';

export const getMealReviews = async (req: Request, res: Response) => {
  try {
    const hostelId = req.user!.hostelId;

    // Query params
    const {
      mealType,
      date,
      dishId,
      page = '1',
      limit = '10'
    } = req.query;

    // Pagination
    const pageNum = Math.max(parseInt(page as string, 10), 1);
    const limitNum = Math.min(parseInt(limit as string, 10), 50); // cap limit
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query: any = { hostelId };

    if (mealType) {
      query.mealType = mealType;
    }

    if (dishId) {
      query.dishId = dishId;
    }

    if (date) {
      const start = new Date(date as string);
      const end = new Date(date as string);
      end.setHours(23, 59, 59, 999);

      query.servedOn = {
        $gte: start,
        $lte: end
      };
    }

    // Fetch data + count in parallel
    const [reviews, total] = await Promise.all([
      MealReview.find(query)
        .populate('studentId', 'name email')
        .populate('dishId', 'name mealType')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),

      MealReview.countDocuments(query)
    ]);

    return res.status(200).json({
      reviews,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });

  } catch (error: any) {
    return res.status(500).json({
      message: 'Failed to fetch reviews',
      error: error.message
    });
  }
};
