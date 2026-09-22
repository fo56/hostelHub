import { Request, Response } from 'express';
import { Dish } from '../models/Dish';
import { ActivityLog } from '../models/ActivityLog';

export const fetchDishes = async (req: Request, res: Response) => {
    const { status } = req.query;
    const hostelId = req.user?.hostelId;

    if (!hostelId) return res.status(400).json({ message: 'Hostel context is required' });

    const filter: Record<string, any> = { hostelId };
    if (status) filter.status = status;

    const dishes = await Dish.find(filter)
      .populate('suggestedBy', 'name email')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 })
      .lean(); 

    return res.status(200).json(dishes);
};

export const approveDish = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { priceScore, healthScore } = req.body;
    const adminId = req.user?._id;
    const hostelId = req.user?.hostelId;

    if (!adminId || !hostelId) return res.status(400).json({ message: 'User context missing' });

    if (
      typeof priceScore !== 'number' || typeof healthScore !== 'number' ||
      priceScore < 1 || priceScore > 5 || healthScore < 1 || healthScore > 5
    ) {
      return res.status(400).json({ message: 'priceScore and healthScore must be numbers between 1 and 5' });
    }

    const dish = await Dish.findOneAndUpdate(
      { _id: id, hostelId, status: 'UNDER_REVIEW' },
      { status: 'ACTIVE', priceScore, healthScore, approvedBy: adminId },
      { returnDocument: 'after' }
    );

    if (!dish) return res.status(404).json({ message: 'Dish not found, already reviewed, or unauthorized' });

    await ActivityLog.create({ hostelId, userId: adminId, action: `APPROVED_DISH:${dish.name}`,});

    return res.status(200).json({ message: 'Dish approved successfully', dish });
};

export const rejectDish = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user?._id;
    const hostelId = req.user?.hostelId;

    if (!adminId || !hostelId) return res.status(400).json({ message: 'User context missing' });
    if (!reason || typeof reason !== 'string') return res.status(400).json({ message: 'Rejection reason is required' });

    const dish = await Dish.findOneAndUpdate(
      { _id: id, hostelId, status: 'UNDER_REVIEW' },
      { status: 'INACTIVE', rejectionReason: reason },
      { returnDocument: 'after' }
    );

    if (!dish) return res.status(404).json({ message: 'Dish not found, already reviewed, or unauthorized' });

    await ActivityLog.create({ hostelId, userId: adminId, action: `REJECTED_DISH:${dish.name} | Reason: ${reason}`,});

    return res.status(200).json({ message: 'Dish rejected successfully' });
};

export const updateDish = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, mealType, category, tags, priceScore, healthScore, itemClass } = req.body;
    const adminId = req.user?._id;
    const hostelId = req.user?.hostelId;

    if (!adminId || !hostelId) return res.status(400).json({ message: 'User context missing' });

    if (
      typeof priceScore !== 'number' || typeof healthScore !== 'number' ||
      priceScore < 1 || priceScore > 5 || healthScore < 1 || healthScore > 5
    ) {
      return res.status(400).json({ message: 'priceScore and healthScore must be numbers between 1 and 5' });
    }

    const dish = await Dish.findOneAndUpdate(
      { _id: id, hostelId },
      { name, mealType, category, tags, priceScore, healthScore, itemClass },
      { new: true }
    );

    if (!dish) return res.status(404).json({ message: 'Dish not found or unauthorized' });

    await ActivityLog.create({ hostelId, userId: adminId, action: `UPDATED_DISH:${dish.name}`,});

    return res.status(200).json({ message: 'Dish updated successfully', dish });
};

export const deleteDish = async (req: Request, res: Response) => {
    const { id } = req.params;
    const adminId = req.user?._id;
    const hostelId = req.user?.hostelId;

    if (!adminId || !hostelId) return res.status(400).json({ message: 'User context missing' });

    const dish = await Dish.findOneAndDelete({ _id: id, hostelId });

    if (!dish) return res.status(404).json({ message: 'Dish not found or unauthorized' });

    await ActivityLog.create({ hostelId, userId: adminId, action: `DELETED_DISH:${dish.name}`,});

    return res.status(200).json({ message: 'Dish deleted successfully' });
};
export const toggleDishStatus = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, note } = req.body;
    const dish = await Dish.findByIdAndUpdate(id, { status, rejectionReason: note || '' }, { new: true });
    if (!dish) return res.status(404).json({ message: 'Dish not found' });
    return res.status(200).json(dish);
};
