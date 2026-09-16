/**
 * Handles the algorithmic scoring and ranking of dishes based on student votes, 
 * cost efficiency, and health metrics. 
 * Does not handle final menu construction — see menuBuilder.service.ts.
 */
import { Dish } from '../models/Dish';
import { MenuRecommendation } from '../models/MenuRecommendation';

/**
 * Computes and stores the recommended menu items for a hostel.
 * 
 * Executes an intensive MongoDB aggregation pipeline to:
 * 1. Count occurrences of each active dish across all student votes.
 * 2. Normalize the vote count against the most-voted dish (voteScore).
 * 3. Calculate costEfficiency based on the dish's priceScore.
 * 4. Generate a weighted finalScore (50% votes, 30% health, 20% cost).
 * 
 * NOTE: This clears and fully repopulates the MenuRecommendation collection 
 * for the specified hostel. It is meant to be run periodically or manually 
 * triggered by an admin before building the final menu.
 * 
 * @param hostelId - The ID of the hostel to compute recommendations for.
 * @returns An object indicating success and the count of computed recommendations.
 */
export const computeMenuRecommendations = async (hostelId: string) => {
  const pipeline = [
    {
      $match: {
        status: 'ACTIVE',
        itemClass: 'ROTATING',
        mealType: { $exists: true }, // Keeping for backwards compatibility if needed, but it maps to mealName
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
                $size: {
                  $filter: {
                    input: {
                      $reduce: {
                        input: { $ifNull: ['$votes', []] },
                        initialValue: [],
                        in: { $concatArrays: ['$$value', { $ifNull: ['$$this.dishes', []] }] }
                      }
                    },
                    as: 'd',
                    cond: { $eq: ['$$d', '$$dishId'] }
                  }
                }
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
      // 4. Join with MealReview to get average ratings
      $lookup: {
        from: 'mealreviews',
        let: { dishId: '$_id', targetHostel: { $toObjectId: hostelId } },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$hostelId', '$$targetHostel'] },
                  { $eq: ['$dishId', '$$dishId'] }
                ]
              }
            }
          },
          {
            $group: {
              _id: null,
              avgRating: { $avg: '$rating' }
            }
          }
        ],
        as: 'reviewData'
      }
    },
    {
      $addFields: {
        avgRating: {
          $ifNull: [{ $arrayElemAt: ['$reviewData.avgRating', 0] }, 3] // Default to 3 if no reviews
        }
      }
    },
    {
      // 5. Calculate sub-scores
      $addFields: {
        voteScore: {
          $cond: [
            { $gt: ['$maxVotes', 0] },
            { $divide: ['$weeklyVoteCount', '$maxVotes'] },
            0
          ]
        },
        reviewScore: {
          $divide: ['$avgRating', 5]
        },
        costEfficiency: {
          $cond: [
            { $gt: ['$priceScore', 0] },
            { $divide: [5, '$priceScore'] },
            { $sub: [1, '$priceScore'] },
            0
          ]
        },
        healthEfficiency: {
          $cond: [
            { $gt: ['$healthScore', 0] },
            { $divide: [5, '$healthScore'] },
            0
          ]
        }
      }
    },
    {
      // 6. Compute the final weighted score
      $addFields: {
        finalScore: {
          $add: [
            { $multiply: [0.4, '$voteScore'] },
            { $multiply: [0.2, '$reviewScore'] },
            { $multiply: [0.2, '$healthEfficiency'] },
            { $multiply: [0.2, '$costEfficiency'] }
          ]
        }
      }
    },
    {
      $project: {
        hostelId: 1,
        dishId: '$_id',
        mealName: '$mealType',
        categoryName: '$category',
        voteScore: 1,
        healthEfficiency: 1,
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