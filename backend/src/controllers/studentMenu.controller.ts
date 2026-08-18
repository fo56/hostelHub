import { Request, Response } from 'express';
import { formatMeal } from '../utils/formatMeal';
import * as MenuRetrieve from '../services/menuRetrieve.service';
/**
 * GET CURRENT MESS MENU (latest published)
 */
export const getCurrentMessMenu = async (req: Request, res: Response) => {
  try {
    const hostelId = req.user!.hostelId

    const menu = await MenuRetrieve.getCurrentMenu(hostelId.toString())

    if (!menu) {
      return res.status(404).json({
        message: 'Mess menu has not been published yet'
      })
    }

    return res.json({
      breakfast: formatMeal(menu.breakfast),
      lunch: formatMeal(menu.lunch),
      dinner: formatMeal(menu.dinner),
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

    const todayMenu = await MenuRetrieve.getTodayMenu(hostelId.toString())

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