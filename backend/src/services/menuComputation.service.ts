import { Dish } from '../models/Dish';
import { MenuRecommendation } from '../models/MenuRecommendation';

export const computeMenuRecommendations = async (hostelId: string) => {
  const pipeline = [
    {
      $match: {
        status: 'ACTIVE',
        mealType: { $exists: true },
        // Convert string hostelId to ObjectId for matching
        $expr: { $eq: ['$hostelId', { $toObjectId: hostelId }] }
      }
    },
    {
      // 1. Join with StudentVote collection and dynamically count votes
      $lookup: {
        from: 'studentvotes', // Default Mongoose collection name for the StudentVote model
        let: { dishId: '$_id', targetHostel: { $toObjectId: hostelId } },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$hostelId', '$$targetHostel'] }
            }
          },
          {
            // Count occurrences of this specific dishId in the student's meal arrays
            $project: {
              matchCount: {
                $add: [
                  { $size: { $filter: { input: { $ifNull: ['$breakfast', []] }, as: 'b', cond: { $eq: ['$$b', '$$dishId'] } } } },
                  { $size: { $filter: { input: { $ifNull: ['$lunch', []] }, as: 'l', cond: { $eq: ['$$l', '$$dishId'] } } } },
                  { $size: { $filter: { input: { $ifNull: ['$dinner', []] }, as: 'd', cond: { $eq: ['$$d', '$$dishId'] } } } }
                ]
              }
            }
          },
          {
            // Sum all occurrences across all students in this hostel
            $group: {
              _id: null,
              totalVotes: { $sum: '$matchCount' }
            }
          }
        ],
        as: 'voteData'
      }
    },
    {
      // 2. Extract the sum from the array returned by lookup (defaults to 0 if no votes)
      $addFields: {
        weeklyVoteCount: {
          $ifNull: [{ $arrayElemAt: ['$voteData.totalVotes', 0] }, 0]
        }
      }
    },
    {
      // 3. Find maxVotes across all dishes to establish a baseline for the curve
      $group: {
        _id: null,
        maxVotes: { $max: '$weeklyVoteCount' },
        dishes: { $push: '$$ROOT' }
      }
    },
    { $unwind: '$dishes' },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: ['$dishes', { maxVotes: '$maxVotes' }]
        }
      }
    },
    {
      // 4. Calculate sub-scores
      $addFields: {
        voteScore: {
          $cond: [
            { $gt: ['$maxVotes', 0] },
            { $divide: ['$weeklyVoteCount', '$maxVotes'] },
            0
          ]
        },
        costEfficiency: {
          $cond: [
            { $gt: ['$priceScore', 0] },
            { $divide: [1, '$priceScore'] },
            0
          ]
        }
      }
    },
    {
      // 5. Compute the final weighted score
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
    {
      $project: {
        hostelId: 1,
        dishId: '$_id',
        mealType: 1,
        voteScore: 1,
        healthScore: 1,
        costEfficiency: 1,
        finalScore: 1,
        _id: 0 // Exclude original Dish _id
      }
    }
  ];

  const computedResults = await Dish.aggregate(pipeline);

  // Clear previous recommendations and save new ones
  await MenuRecommendation.deleteMany({ hostelId });
  
  await MenuRecommendation.insertMany(
    computedResults.map(item => ({
      ...item,
      computedAt: new Date()
    }))
  );

  return {
    success: true,
    count: computedResults.length
  };
};