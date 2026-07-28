import { MessMenu } from '../models/MessMenu'
import { formatMeal } from '../utils/formatMeal';

// CURRENT PUBLISHED MENU
export async function getCachedCurrentMenu(hostelId: string) {
  const menu = await MessMenu.findOne({
    hostelId,
    published: true
  })
    .populate({
      path: 'breakfast lunch dinner',
      populate: {
        path: 'dishId',
        select: 'name mealType priceScore healthScore weeklyVotes'
      }
    })

  return menu
}

// TODAY’S SERVED DISHES
export async function getCachedTodayMenu(hostelId: string) {
  const menu = await getCachedCurrentMenu(hostelId)
  if (!menu) return null

  const jsDay = new Date().getDay()
  const dayIndex = jsDay === 0 ? 6 : jsDay - 1

  const todayMenu = {
    date: new Date().toISOString().split('T')[0],
    dayIndex,
    breakfast: formatMeal(menu.breakfast)[dayIndex],
    lunch: formatMeal(menu.lunch)[dayIndex],
    dinner: formatMeal(menu.dinner)[dayIndex]
  }

  return todayMenu
}