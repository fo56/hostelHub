import { Dish } from '../models/Dish'
import { MenuRecommendation } from '../models/MenuRecommendation'

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
      // Calculate total votes across all weeks since we no longer track weeks
      $addFields: {
        weeklyVoteCount: {
          $reduce: {
            input: { $objectToArray: "$weeklyVotes" },
            initialValue: 0,
            in: { $add: ["$$value", "$$this.v"] }
          }
        }
      }
    },
    {
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
    {
      $project: {
        hostelId: 1,
        dishId: '$_id',
        mealType: 1,
        voteScore: 1,
        healthScore: 1,
        costEfficiency: 1,
        finalScore: 1,
        _id: 0
      }
    }
  ]

  const computedResults = await Dish.aggregate(pipeline)

  // Delete all previous recommendations for this hostel
  await MenuRecommendation.deleteMany({ hostelId })
  
  await MenuRecommendation.insertMany(
    computedResults.map(item => ({
      ...item,
      computedAt: new Date()
    }))
  )

  return {
    success: true,
    count: computedResults.length
  }
}