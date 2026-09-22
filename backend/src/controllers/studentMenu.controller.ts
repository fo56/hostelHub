import { Request, Response } from 'express';
import { formatMeal } from '../utils/formatMeal';
import * as MenuRetrieve from '../services/menuRetrieve.service';
/**
 * GET CURRENT MESS MENU (latest published)
 */
export const getCurrentMessMenu = async (req: Request, res: Response) => {
    const hostelId = req.user!.hostelId

    const menu = await MenuRetrieve.getCurrentMenu(hostelId.toString())

    if (!menu) {
      return res.status(200).json(null)
    }

    return res.json({
      meals: menu.meals,
      generatedAt: menu.generatedAt
    })

}

/**
 * GET TODAY'S SERVED DISHES
 */
export const getServedDishesToday = async (req: Request, res: Response) => {
    const hostelId = req.user!.hostelId

    const todayMenu = await MenuRetrieve.getTodayMenu(hostelId.toString())

    if (!todayMenu) {
      return res.status(404).json({
        message: 'No published menu found'
      })
    }

    return res.status(200).json(todayMenu)

}