import { MessMenu } from '../models/MessMenu'
import { formatMeal } from '../utils/formatMeal';

// CURRENT PUBLISHED MENU
export async function getCurrentMenu(hostelId: string) {
  const menu = await MessMenu.findOne({
    hostelId,
    status: 'PUBLISHED'
  })
    .populate('meals.slots.fixedItems', 'name mealType priceScore healthScore category')
    .populate('meals.slots.rotatingItems.item', 'name mealType priceScore healthScore category');

  return menu
}

// TODAY’S SERVED DISHES
export async function getTodayMenu(hostelId: string) {
  const menu = await getCurrentMenu(hostelId)
  if (!menu) return null

  const jsDay = new Date().getUTCDay()
  const dayIndex = jsDay === 0 ? 6 : jsDay - 1

  const todayMeals = menu.meals.map(meal => ({
    mealName: meal.mealName,
    slot: meal.slots?.[dayIndex] || null
  }));

  const todayMenu = {
    date: new Date().toISOString().split('T')[0],
    dayIndex,
    meals: todayMeals
  }

  return todayMenu
}