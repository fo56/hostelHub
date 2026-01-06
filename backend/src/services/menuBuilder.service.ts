import { MenuRecommendation } from '../models/MenuRecommendation'
import { MessMenu } from '../models/MessMenu'
import { redis } from './redis.service'

const BUILD_LOCK_TTL = 60 * 60 * 24        // 1 hour

export const buildMessMenu = async (
  hostelId: string,
  week: number
) => {
  const lockKey = `lock:menu:build:${hostelId}:${week}`

  const lock = await redis.set(lockKey, 'locked', { NX: true, EX: BUILD_LOCK_TTL })
  if (!lock) {
    throw new Error('Menu build already in progress')
  }

  try {
    // Prevent rebuilding published menu
    const existing = await MessMenu.findOne({ hostelId, week })
    if (existing) {
      return existing
    }

    const MEALS = ['Breakfast', 'Lunch', 'Dinner'] as const
    const menu: Record<typeof MEALS[number], any[]> = {
      Breakfast: [],
      Lunch: [],
      Dinner: []
    }

    for (const meal of MEALS) {
      const dishes = await MenuRecommendation.find({
        hostelId,
        week,
        mealType: meal
      })
        .sort({ finalScore: -1 })
        .limit(7)

      if (dishes.length < 7) {
        throw new Error(`Not enough dishes for ${meal}`)
      }

      menu[meal] = dishes
    }

    return await MessMenu.create({
      hostelId,
      week,
      breakfast: menu.Breakfast,
      lunch: menu.Lunch,
      dinner: menu.Dinner,
      generatedAt: new Date(),
      published: false
    })
  } finally {
    await redis.del(lockKey)
  }
}
