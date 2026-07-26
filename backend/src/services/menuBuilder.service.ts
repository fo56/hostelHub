import { MenuRecommendation } from '../models/MenuRecommendation'
import { MessMenu } from '../models/MessMenu'
import { redis } from './redis.service'

const BUILD_LOCK_TTL = 60 * 60 * 24        // 1 hour

export const buildMessMenu = async (hostelId: string) => {
  const lockKey = `lock:menu:build:${hostelId}`

  const lock = await redis.set(lockKey, 'locked', { NX: true, EX: BUILD_LOCK_TTL })
  if (!lock) {
    throw new Error('Menu build already in progress')
  }

  try {
    const MEALS = ['Breakfast', 'Lunch', 'Dinner'] as const
    const menu: Record<typeof MEALS[number], any[]> = {
      Breakfast: [],
      Lunch: [],
      Dinner: []
    }

    for (const meal of MEALS) {
      const dishes = await MenuRecommendation.find({
        hostelId,
        mealType: meal
      })
        .sort({ finalScore: -1 })
        .limit(7)

      if (dishes.length < 7) {
        throw new Error(`Not enough dishes for ${meal}. Required 7, found ${dishes.length}`)
      }

      menu[meal] = dishes
    }

    // Upsert the menu for the hostel
    return await MessMenu.findOneAndUpdate(
      { hostelId },
      {
        breakfast: menu.Breakfast,
        lunch: menu.Lunch,
        dinner: menu.Dinner,
        generatedAt: new Date(),
        published: false
      },
      { upsert: true, new: true }
    )
  } finally {
    await redis.del(lockKey)
  }
}
