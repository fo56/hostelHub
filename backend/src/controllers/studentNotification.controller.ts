import { Request, Response } from 'express'
import { Dish } from '../models/Dish'

/**
 * GET STUDENT NOTIFICATIONS
 * Route: GET /student/notifications
 */
export const getStudentNotifications = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user!._id
    const hostelId = req.user!.hostelId

    const dishes = await Dish.find({
      hostelId,
      suggestedBy: userId,
      status: { $in: ['ACTIVE', 'INACTIVE'] }
    })
      .select(
        'name status priceScore healthScore rejectionReason updatedAt'
      )
      .sort({ updatedAt: -1 })

    const notifications = dishes.map(dish => {
      if (dish.status === 'ACTIVE') {
        return {
          type: 'APPROVED',
          dishName: dish.name,
          priceScore: dish.priceScore,
          healthScore: dish.healthScore,
          date: dish.updatedAt
        }
      }

      return {
        type: 'REJECTED',
        dishName: dish.name,
        reason: dish.rejectionReason || 'No reason provided',
        date: dish.updatedAt
      }
    })

    return res.status(200).json(notifications)
  } catch (error: any) {
    return res.status(500).json({
      message: 'Failed to fetch notifications',
      error: error.message
    })
  }
}
