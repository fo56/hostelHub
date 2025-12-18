import { Request, Response } from 'express';
import { MenuVote } from '../models/MenuVote';
import { Dish } from '../models/Dish';

export const submitMenuVotes = async (req: Request, res: Response) => {
  try {
    const { week, votes } = req.body;
    const { _id: userId, hostelId } = req.user!;

    if (!week || !votes) {
      return res.status(400).json({ message: 'Invalid payload' });
    }

    // Validate minimum 7 dishes per meal
    for (const meal of ['Breakfast', 'Lunch', 'Dinner']) {
      if (!votes[meal] || votes[meal].length < 7) {
        return res.status(400).json({
          message: `Minimum 7 dishes required for ${meal}`
        });
      }
    }

    const bulkVotes = [];

    for (const [mealType, dishIds] of Object.entries(votes)) {
      for (const dishId of dishIds as string[]) {
        const dish = await Dish.findOne({
          _id: dishId,
          status: 'ACTIVE',
          mealType
        });

        if (!dish) {
          return res.status(400).json({
            message: `Invalid dish selected for ${mealType}`
          });
        }

        bulkVotes.push({
          hostelId,
          userId,
          dishId,
          week
        });
      }
    }

    await MenuVote.insertMany(bulkVotes, { ordered: false });

    return res.status(201).json({
      message: 'Votes submitted successfully'
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'You have already voted for some dishes this week'
      });
    }

    return res.status(500).json({
      message: 'Failed to submit votes',
      error: error.message
    });
  }
};
