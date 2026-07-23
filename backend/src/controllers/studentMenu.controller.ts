import { Request, Response } from 'express';
import { MessMenu } from '../models/MessMenu';
import { MenuVoteWindow } from '../models/MenuVoteWindow';
import * as MenuCache from '../services/menuCache.service'
import { formatMeal } from '../utils/formatMeal';
/**
 * GET CURRENT MESS MENU (latest published)
 */
export const getCurrentMessMenu = async (req: Request, res: Response) => {
  try {
    const hostelId = req.user!.hostelId

    const menu = await MenuCache.getCachedCurrentMenu(JSON.stringify(hostelId))

    if (!menu) {
      return res.status(404).json({
        message: 'Mess menu has not been published yet'
      })
    }

    return res.json({
  week: menu.week,
  breakfast: formatMeal(menu.breakfast, menu.week),
  lunch: formatMeal(menu.lunch, menu.week),
  dinner: formatMeal(menu.dinner, menu.week),
  generatedAt: menu.generatedAt
})

  } catch (error: any) {
    return res.status(500).json({
      message: 'Failed to fetch mess menu',
      error: error.message
    })
  }
}


/**
 * GET TODAY'S SERVED DISHES
 */
export const getServedDishesToday = async (req: Request, res: Response) => {
  try {
    const hostelId = req.user!.hostelId

    const todayMenu = await MenuCache.getCachedTodayMenu(JSON.stringify(hostelId))

    if (!todayMenu) {
      return res.status(404).json({
        message: 'No published menu found'
      })
    }

    return res.status(200).json(todayMenu)

  } catch (error: any) {
    return res.status(500).json({
      message: 'Failed to fetch today’s served dishes',
      error: error.message
    })
  }
}