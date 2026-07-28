import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { StudentVote } from '../models/StudentVote';
import { Dish } from '../models/Dish';

/**
 * GET voting dashboard data:
 * - All ACTIVE dishes belonging to the student's hostel
 * - The student's current saved votes
 */
export const getStudentVotes = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const hostelId = req.user?.hostelId;

    if (!userId || !hostelId) {
      return res.status(400).json({ message: 'User authentication context missing' });
    }

    // 1. Fetch all ACTIVE dishes for this hostel (Returns a flat Array)
    const availableDishes = await Dish.find({
      hostelId,
      status: 'ACTIVE'
    })
      .select('_id name mealType category healthScore priceScore tags')
      .lean();

    // 2. Fetch student's existing vote record 
    const voteRecord = await StudentVote.findOne({ userId, hostelId })
      .populate('breakfast', '_id name mealType category healthScore priceScore')
      .populate('lunch', '_id name mealType category healthScore priceScore')
      .populate('dinner', '_id name mealType category healthScore priceScore')
      .lean();

    return res.status(200).json({
      availableDishes,
      votes: {
        breakfast: voteRecord?.breakfast || [],
        lunch: voteRecord?.lunch || [],
        dinner: voteRecord?.dinner || []
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      message: 'Failed to fetch voting options',
      error: error.message
    });
  }
};

/**
 * UPSERT student preferences (Save / Edit anytime)
 */
export const saveStudentVotes = async (req: Request, res: Response) => {
  try {
    const { votes } = req.body; 
    const userId = req.user?._id;
    const hostelId = req.user?.hostelId;

    if (!userId || !hostelId) {
      return res.status(400).json({ message: 'User authentication context missing' });
    }

    if (!votes || typeof votes !== 'object') {
      return res.status(400).json({ message: 'Invalid payload format' });
    }

    const meals = ['breakfast', 'lunch', 'dinner'] as const;

    // 1. Validate exactly 7 dishes per category
    for (const meal of meals) {
      if (!Array.isArray(votes[meal]) || votes[meal].length !== 7) {
        return res.status(400).json({
          message: `Exactly 7 dishes are required for ${meal}`
        });
      }
    }

    // 2. Flatten all submitted dish IDs and check for valid ObjectId formatting
    const allSubmittedDishIds: string[] = [
      ...votes.breakfast,
      ...votes.lunch,
      ...votes.dinner
    ];

    const hasInvalidFormat = allSubmittedDishIds.some(
      (id) => !mongoose.Types.ObjectId.isValid(id)
    );

    if (hasInvalidFormat) {
      return res.status(400).json({ message: 'One or more dish IDs are invalid' });
    }

    // 3. Extract unique IDs and verify they exist in this hostel and are ACTIVE
    const uniqueSubmittedIds = Array.from(new Set(allSubmittedDishIds));

    const validDishesCount = await Dish.countDocuments({
      _id: { $in: uniqueSubmittedIds },
      hostelId,
      status: 'ACTIVE'
    });

    if (validDishesCount !== uniqueSubmittedIds.length) {
      return res.status(400).json({
        message: 'One or more selected dishes are inactive or do not belong to your hostel'
      });
    }

    // 4. Save/Update student preferences
    const updatedVotes = await StudentVote.findOneAndUpdate(
      { userId, hostelId },
      {
        breakfast: votes.breakfast,
        lunch: votes.lunch,
        dinner: votes.dinner
      },
      { upsert: true, new: true, runValidators: true }
    );

    return res.status(200).json({
      message: 'Preferences saved successfully',
      votes: updatedVotes
    });
  } catch (error: any) {
    return res.status(500).json({
      message: 'Failed to save votes',
      error: error.message
    });
  }
};