import { Request, Response } from 'express';
import { MenuVote } from '../models/MenuVote';
import { Dish } from '../models/Dish';

export const submitMenuVotes = async (req: Request, res: Response) => {
  const session = await MenuVote.startSession();
  session.startTransaction();

  try {
    const { week, votes } = req.body;
    const { _id: userId, hostelId } = req.user!;

    if (!week || !votes) {
      return res.status(400).json({ message: 'Invalid payload' });
    }

    // 1️⃣ Idempotency guard
    const alreadyVoted = await MenuVote.exists(
      { hostelId, userId, week }
    );

    if (alreadyVoted) {
      await session.abortTransaction();
      return res.status(409).json({
        message: 'You have already voted for this week'
      });
    }

    // 2️⃣ Validate minimum dishes
    for (const meal of ['Breakfast', 'Lunch', 'Dinner']) {
      if (!votes[meal] || votes[meal].length < 7) {
        await session.abortTransaction();
        return res.status(400).json({
          message: `Minimum 7 dishes required for ${meal}`
        });
      }
    }

    // 3️⃣ Build votes atomically
    const bulkVotes = [];

    for (const [mealType, dishIds] of Object.entries(votes)) {
      for (const dishId of dishIds as string[]) {
        bulkVotes.push({
          hostelId,
          userId,
          dishId,
          week
        });
      }
    }

    // 4️⃣ Atomic insert
    await MenuVote.insertMany(bulkVotes, { session });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      message: 'Votes submitted successfully'
    });

  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();

    // DB-level idempotency fallback
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'You have already voted for this week'
      });
    }

    return res.status(500).json({
      message: 'Failed to submit votes',
      error: error.message
    });
  }
};
