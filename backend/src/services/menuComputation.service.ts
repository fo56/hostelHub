import { Dish } from '../models/Dish';
import { MenuRecommendation } from '../models/MenuRecommendation';

export const computeMenuRecommendations = async (week: string) => {
  const pipeline = [
    //  Only active dishes
      {
  $match: {
    status: 'ACTIVE',
    mealType: { $exists: true }
  }
},


    //  Extract votes for the given week
    {
      $addFields: {
        weeklyVoteCount: {
          $ifNull: [`$weeklyVotes.${week}`, 0]
        }
      }
    },

    //  Compute max votes (for normalization)
    {
      $group: {
        _id: null,
        maxVotes: { $max: '$weeklyVoteCount' },
        dishes: { $push: '$$ROOT' }
      }
    },

    // Unwind back
    {
      $unwind: '$dishes'
    },

    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: [
            '$dishes',
            { maxVotes: '$maxVotes' }
          ]
        }
      }
    },

    // Normalize vote score
    {
      $addFields: {
        voteScore: {
          $cond: [
            { $gt: ['$maxVotes', 0] },
            { $divide: ['$weeklyVoteCount', '$maxVotes'] },
            0
          ]
        }
      }
    },

    // Cost efficiency
    {
      $addFields: {
        costEfficiency: {
          $cond: [
            { $gt: ['$priceScore', 0] },
            { $divide: [1, '$priceScore'] },
            0
          ]
        }
      }
    },

    // Final weighted score
    {
      $addFields: {
        finalScore: {
          $add: [
            { $multiply: [0.5, '$voteScore'] },
            { $multiply: [0.3, '$healthScore'] },
            { $multiply: [0.2, '$costEfficiency'] }
          ]
        }
      }
    },

    // 8️⃣ Shape output
    {
      $project: {
  hostelId: 1,
  week: { $literal: Number(week) },
  dishId: '$_id',
  mealType: 1,
  voteScore: 1,
  healthScore: 1,
  costEfficiency: 1,
  finalScore: 1,
  _id: 0
}

    }
  ];

  const computedResults = await Dish.aggregate(pipeline);

  // Clear previous recommendations for this week
  await MenuRecommendation.deleteMany({ week: Number(week) });

  // Insert new recommendations
  await MenuRecommendation.insertMany(
    computedResults.map(item => ({
      ...item,
      week,
      computedAt: new Date()
    }))
  );

  return {
    success: true,
    count: computedResults.length
  };
};
