import { Request, Response } from 'express';
import { User } from '../models/User';
import { StudentVote } from '../models/StudentVote';
import { Dish } from '../models/Dish';
import { Hostel } from '../models/Hostel';
import { MealReview } from '../models/MealReview';

export const getStudentStats = async (req: Request, res: Response) => {
    const hostelId = req.user!.hostelId;

    // Total Students and Active Voters
    const totalStudents = await User.countDocuments({ hostelId, role: 'STUDENT', isActive: true });
    const activeVotingStudents = await StudentVote.countDocuments({ hostelId });

    // Active Generation Rules
    const hostel = await Hostel.findById(hostelId);
    const activeConstraints = hostel?.menuConstraints || [];
    const constraints = activeConstraints.map(c => ({
      sourcePhrase: c.sourcePhrase,
      action: c.action
    }));

    // Dish Catalog and Vote Counts
    const allDishes = await Dish.find({ hostelId });
    
    const mongoose = require('mongoose');
    const dishVotesAggr = await StudentVote.aggregate([
      { $match: { hostelId: new mongoose.Types.ObjectId(hostelId as string) } },
      { $unwind: "$votes" },
      { $unwind: "$votes.dishes" },
      { $group: { _id: "$votes.dishes", totalVotes: { $sum: 1 } } }
    ]);

    const dishVotesMap = new Map();
    dishVotesAggr.forEach(d => dishVotesMap.set(d._id.toString(), d.totalVotes));

    const ratingsAggr = await MealReview.aggregate([
      { $match: { hostelId: new mongoose.Types.ObjectId(hostelId as string) } },
      { $group: { _id: "$dishId", avgRating: { $avg: "$rating" }, numRatings: { $sum: 1 } } }
    ]);
    const ratingsMap = new Map();
    ratingsAggr.forEach(r => ratingsMap.set(r._id.toString(), { avgRating: r.avgRating, numRatings: r.numRatings }));

    const dishCatalog = allDishes.map(dish => {
      const ratingData = ratingsMap.get(dish._id.toString());
      return {
        id: dish._id,
        name: dish.name,
        mealType: dish.mealType,
        status: dish.status,
        category: dish.category,
        type: dish.itemClass,
        priceScore: dish.priceScore || '-',
        healthScore: dish.healthScore || '-',
        tags: dish.tags || [],
        rejectionReason: dish.rejectionReason || '',
        totalVotes: dishVotesMap.get(dish._id.toString()) || 0,
        avgRating: ratingData ? ratingData.avgRating.toFixed(1) : '-',
        numRatings: ratingData ? ratingData.numRatings : 0
      };
    });

    return res.status(200).json({
      totalStudents,
      activeVotingStudents,
      constraints,
      dishCatalog
    });
};
