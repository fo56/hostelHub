import { Request, Response } from 'express';
import { Dish } from '../models/Dish';
import { ActivityLog } from '../models/ActivityLog';

// fetch all dishes by status 
export const fetchDishes = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;

    const filter: Record<string, any> = {};
    if (status) {
      filter.status = status;
    }

    const dishes = await Dish.find(filter)
      .populate('suggestedBy', 'name email')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json(dishes);
  } catch (error: any) {
    return res.status(500).json({
      message: 'Failed to fetch dishes',
      error: error.message
    });
  }
};

// Approve a dish and assign scores
export const approveDish = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { priceScore, healthScore } = req.body;
    const adminId = req.user!._id;

    // Validate scores
    if (
      typeof priceScore !== 'number' ||
      typeof healthScore !== 'number' ||
      priceScore < 1 || priceScore > 5 ||
      healthScore < 1 || healthScore > 5
    ) {
      return res.status(400).json({
        message: 'priceScore and healthScore must be numbers between 1 and 5'
      });
    }

    // Update dish
    const dish = await Dish.findOneAndUpdate(
      { _id: id, status: 'UNDER_REVIEW' },
      {
        status: 'ACTIVE',
        priceScore,
        healthScore,
        approvedBy: adminId
      },
      { new: true }
    );

    if (!dish) {
      return res.status(404).json({
        message: 'Dish not found or already reviewed'
      });
    }

    // Activity log
    await ActivityLog.create({
      userId: adminId,
      action: `APPROVED_DISH:${dish.name}`,
      ip: req.ip
    });

    return res.status(200).json({
      message: 'Dish approved successfully',
      dish
    });
  } catch (error: any) {
    return res.status(500).json({
      message: 'Failed to approve dish',
      error: error.message
    });
  }
};

// Reject a dish with reason
export const rejectDish = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user!._id;

    if (!reason || typeof reason !== 'string') {
      return res.status(400).json({
        message: 'Rejection reason is required'
      });
    }

    const dish = await Dish.findOneAndUpdate(
      { _id: id, status: 'UNDER_REVIEW' },
      { status: 'INACTIVE' },
      { new: true }
    );

    if (!dish) {
      return res.status(404).json({
        message: 'Dish not found or already reviewed'
      });
    }

    await ActivityLog.create({
      userId: adminId,
      action: `REJECTED_DISH:${dish.name} | Reason: ${reason}`,
      ip: req.ip
    });

    return res.status(200).json({
      message: 'Dish rejected successfully'
    });
  } catch (error: any) {
    return res.status(500).json({
      message: 'Failed to reject dish',
      error: error.message
    });
  }
};
