import { Request, Response } from 'express';
import { MenuVote } from '../models/MenuVote';
import { Dish } from '../models/Dish';
import mongoose from 'mongoose';
import { MenuVoteWindow } from '../models/MenuVoteWindow';

export const submitMenuVotes = async (req: Request, res: Response) => {
  try {
    const { votes } = req.body;
    const { _id: userId, hostelId } = req.user!;

    const window = await MenuVoteWindow.findOne({
  hostelId,
  isActive: true
});

if (!window) {
  return res.status(403).json({ message: 'Voting closed' });
}

const now = new Date();
if (window.startsAt > now || window.endsAt < now) {
  window.isActive = false;
  await window.save();
  return res.status(403).json({ message: 'Voting closed' });
}

    if (!window) {
      return res.status(403).json({ message: 'Voting closed' });
    }

    const week = window.week; // ✅ ADMIN WEEK

    const meals = ['Breakfast', 'Lunch', 'Dinner'];

    for (const meal of meals) {
      if (!Array.isArray(votes[meal]) || votes[meal].length !== 7) {
        return res.status(400).json({
          message: `Exactly 7 dishes required for ${meal}`
        });
      }
    }

    const alreadyVoted = await MenuVote.exists({ hostelId, userId, week });
    if (alreadyVoted) {
      return res.status(409).json({
        message: 'You have already voted for this week'
      });
    }

    const bulkVotes = [];
    const allDishIds: mongoose.Types.ObjectId[] = [];

    for (const meal of meals) {
      for (const dishId of votes[meal]) {
        bulkVotes.push({
          hostelId,
          userId,
          dishId,
          week
        });
        allDishIds.push(new mongoose.Types.ObjectId(dishId));
      }
    }

    await MenuVote.insertMany(bulkVotes);

    await Dish.updateMany(
      { _id: { $in: allDishIds }, hostelId },
      { $inc: { [`weeklyVotes.${week}`]: 1 } }
    );

    return res.status(201).json({
      message: 'Votes submitted successfully'
    });

  } catch (error: any) {
    console.error('MENU VOTE ERROR:', error);
    return res.status(500).json({
      message: error.message || 'Failed to submit votes'
    });
  }
};
