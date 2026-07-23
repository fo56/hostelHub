import { Request, Response } from 'express'
import { Dish } from '../models/Dish'

export const getActiveDishesForVoting = async (req: Request, res: Response) => {
  try {
    const hostelId = req.user!.hostelId

    const dishes = await Dish.find({
      hostelId,
      status: 'ACTIVE'
    }).select('_id name mealType')

    const grouped = {
      Breakfast: [] as any[],
      Lunch: [] as any[],
      Dinner: [] as any[]
    }

    for (const dish of dishes) {
      if (grouped[dish.mealType as keyof typeof grouped]) {
        grouped[dish.mealType as keyof typeof grouped].push(dish)
      }
    }

    return res.status(200).json(grouped)
  } catch (error: any) {
    return res.status(500).json({
      message: 'Failed to fetch active dishes',
      error: error.message
    })
  }
}