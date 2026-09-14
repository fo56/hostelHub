import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { StudentVote } from '../models/StudentVote';
import { Dish } from '../models/Dish';
import { Hostel } from '../models/Hostel';

/**
 * GET voting dashboard data:
 * - All ACTIVE ROTATING dishes belonging to the student's hostel
 * - The student's current saved votes
 */
export const getStudentVotes = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const hostelId = req.user?.hostelId;

    if (!userId || !hostelId) {
      return res.status(400).json({ message: 'User authentication context missing' });
    }

    const hostel = await Hostel.findById(hostelId);
    if (!hostel) return res.status(404).json({ message: 'Hostel not found' });

    // 1. Fetch all ACTIVE ROTATING dishes for this hostel (Returns a flat Array)
    const availableDishes = await Dish.find({
      hostelId,
      status: 'ACTIVE',
      itemClass: 'ROTATING'
    })
      .select('_id name mealType category healthScore priceScore tags')
      .lean();

    // 2. Fetch student's existing vote record 
    const voteRecord = await StudentVote.findOne({ userId, hostelId })
      .populate('votes.dishes', '_id name mealType category healthScore priceScore')
      .lean();

    return res.status(200).json({
      mealPlan: hostel.mealPlan,
      availableDishes,
      votes: voteRecord?.votes || [],
      wantsNewMenu: voteRecord?.wantsNewMenu || false
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
    const { votes, wantsNewMenu } = req.body; 
    const userId = req.user?._id;
    const hostelId = req.user?.hostelId;

    if (!userId || !hostelId) {
      return res.status(400).json({ message: 'User authentication context missing' });
    }

    if (!Array.isArray(votes)) {
      return res.status(400).json({ message: 'Invalid payload format, expected array of votes' });
    }

    // 2. Flatten all submitted dish IDs and check for valid ObjectId formatting
    const allSubmittedDishIds: string[] = [];
    for (const v of votes) {
      if (Array.isArray(v.dishes)) {
        allSubmittedDishIds.push(...v.dishes);
      }
    }

    const hasInvalidFormat = allSubmittedDishIds.some(
      (id) => !mongoose.Types.ObjectId.isValid(id)
    );

    if (hasInvalidFormat) {
      return res.status(400).json({ message: 'One or more dish IDs are invalid' });
    }

    // 3. Extract unique IDs and verify they exist in this hostel, are ACTIVE, and are ROTATING
    const uniqueSubmittedIds = Array.from(new Set(allSubmittedDishIds));

    const validDishesCount = await Dish.countDocuments({
      _id: { $in: uniqueSubmittedIds },
      hostelId,
      status: 'ACTIVE',
      itemClass: 'ROTATING'
    });

    if (validDishesCount !== uniqueSubmittedIds.length) {
      return res.status(400).json({
        message: 'One or more selected dishes are invalid (must be active rotating dishes belonging to your hostel)'
      });
    }

    // 4. Save/Update student preferences
    const updatedVotes = await StudentVote.findOneAndUpdate(
      { userId, hostelId },
      {
        votes: votes,
        ...(wantsNewMenu !== undefined && { wantsNewMenu })
      },
      { upsert: true, returnDocument: 'after', runValidators: true }
    );

    // 5. Check if we should trigger auto-generation
    const totalVoters = await StudentVote.countDocuments({ hostelId });
    const votersWantingNewMenu = await StudentVote.countDocuments({ hostelId, wantsNewMenu: true });
    
    if (totalVoters > 0 && (votersWantingNewMenu / totalVoters) >= 0.5) {
      const ComputationService = require('../services/menuComputation.service');
      const BuilderService = require('../services/menuBuilder.service');
      
      await ComputationService.computeMenuRecommendations(hostelId.toString());
      await BuilderService.buildMessMenu(hostelId.toString(), true, 'AUTO');
      await StudentVote.updateMany({ hostelId }, { wantsNewMenu: false });
    }

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