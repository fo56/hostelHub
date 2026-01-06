import { Dish } from '../models/Dish'
import { MenuRecommendation } from '../models/MenuRecommendation'
import { redis } from './redis.service'

const COMPUTE_TTL = 60 * 60 * 24 * 7   // 1 week
const LOCK_TTL = 60 * 60 * 24        // 1 hour

export const computeMenuRecommendations = async (week: string) => {
  const lockKey = `lock:menu:compute:${week}`
  const cacheKey = `cache:menu:recommendations:${week}`

  // Prevent duplicate computation
  const lock = await redis.set(lockKey, 'locked', { EX: LOCK_TTL })
  if (!lock) {
    return { success: true, message: 'Already computing' }
  }

  try {
    // Return cached result if exists
    const cached = await redis.get(cacheKey)
    if (cached) {
      return JSON.parse(cached)
    }

    const pipeline = [
      {
        $match: {
          status: 'ACTIVE',
          mealType: { $exists: true }
        }
      },
      {
        $addFields: {
          weeklyVoteCount: {
            $ifNull: [`$weeklyVotes.${week}`, 0]
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
    ]

    const computedResults = await Dish.aggregate(pipeline)

    await MenuRecommendation.deleteMany({ week: Number(week) })
    await MenuRecommendation.insertMany(
      computedResults.map(item => ({
        ...item,
        week,
        computedAt: new Date()
      }))
    )

    const result = {
      success: true,
      count: computedResults.length
    }

    // Cache computation result 
    await redis.set(
      cacheKey,
      JSON.stringify(result),
      { EX: COMPUTE_TTL }
    )

    return result
  } finally {
    // Always release lock
    await redis.del(lockKey)
  }
}
