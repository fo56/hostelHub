import { redis } from './redis.service'
import { MessMenu } from '../models/MessMenu'

const CURRENT_MENU_TTL = 60 * 60 * 24 * 7   // 1 week
const TODAY_MENU_TTL = 60 * 60 * 24        // 1 hour

// CURRENT PUBLISHED MENU
export async function getCachedCurrentMenu(hostelId: string) {
  const key = `hostel:${hostelId}:menu:current`

  const cached = await redis.get(key)
  if (cached) {
    return JSON.parse(cached)
  }

  const menu = await MessMenu.findOne({
    hostelId,
    published: true
  })
    .sort({ week: -1 })
    .populate({
      path: 'breakfast lunch dinner',
      populate: {
        path: 'dishId',
        select: 'name mealType'
      }
    })

  if (menu) {
    await redis.set(
      key,
      JSON.stringify(menu),
      { EX: CURRENT_MENU_TTL }
    )
  }

  return menu
}

// TODAY’S SERVED DISHES
export async function getCachedTodayMenu(hostelId: string) {
  const key = `hostel:${hostelId}:menu:today`

  const cached = await redis.get(key)
  if (cached) {
    return JSON.parse(cached)
  }

  const menu = await getCachedCurrentMenu(hostelId)
  if (!menu) return null

  const jsDay = new Date().getDay()
  const dayIndex = jsDay === 0 ? 6 : jsDay - 1

  const todayMenu = {
    date: new Date().toISOString().split('T')[0],
    dayIndex,
    breakfast: menu.breakfast[dayIndex] ?? null,
    lunch: menu.lunch[dayIndex] ?? null,
    dinner: menu.dinner[dayIndex] ?? null
  }

  await redis.set(
    key,
    JSON.stringify(todayMenu),
    { EX: TODAY_MENU_TTL }
  )

  return todayMenu
}

// CACHE INVALIDATION
export async function invalidateMenuCache(hostelId: string) {
  await redis.del([
    `hostel:${hostelId}:menu:current`,
    `hostel:${hostelId}:menu:today`
  ])
}
