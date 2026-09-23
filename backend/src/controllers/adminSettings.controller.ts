import { Request, Response } from 'express';
import { Hostel } from '../models/Hostel';
import { Dish } from '../models/Dish';
import { ActivityLog } from '../models/ActivityLog';
import { parseMenuConstraints } from '../services/menuConstraintParser.service';
import { validateConstraints } from '../services/menuConstraintValidator.service';

export const getSettings = async (req: Request, res: Response) => {
    const hostelId = req.user!.hostelId;
    const hostel = await Hostel.findById(hostelId).select('mealPlan issueCategories menuConstraints menuConstraintsText');
    
    if (!hostel) return res.status(404).json({ message: 'Hostel not found' });

    // Provide default issue categories if none exist
    let categories = hostel.issueCategories;
    if (!categories || categories.length === 0) {
      categories = [
        { name: 'Electrician', isActive: true },
        { name: 'Plumbing', isActive: true },
        { name: 'Carpenter', isActive: true },
        { name: 'Cleaning', isActive: true },
        { name: 'Other', isActive: true }
      ] as any;
    }

    return res.status(200).json({
      mealPlan: hostel.mealPlan,
      issueCategories: categories,
      menuConstraints: hostel.menuConstraints || [],
      menuConstraintsText: hostel.menuConstraintsText || ''
    });
};

export const updateSettings = async (req: Request, res: Response) => {
    const hostelId = req.user!.hostelId;
    const { mealPlan, issueCategories } = req.body;

    const hostel = await Hostel.findById(hostelId);
    if (!hostel) return res.status(404).json({ message: 'Hostel not found' });

    // Handle cascading deletes for meal categories
    // If a category was deleted entirely from the payload, we need to delete its dishes.
    // The frontend will actually handle soft-delete (isActive: false). 
    // If it's missing entirely from the array, it means it was explicitly HARD deleted.
    const oldMealPlan = hostel.mealPlan;
    
    for (const oldMeal of oldMealPlan) {
      const newMeal = mealPlan.find((m: any) => m.mealName === oldMeal.mealName);
      if (newMeal) {
        for (const oldCat of oldMeal.categories) {
          const catExists = newMeal.categories.find((c: any) => c.categoryName === oldCat.categoryName);
          if (!catExists) {
            // Category was permanently deleted
            const dishesToDelete = await Dish.find({ hostelId, mealType: oldMeal.mealName, category: oldCat.categoryName });
            for (const d of dishesToDelete) {
              await Dish.findOneAndDelete({ _id: d._id });
            }
          }
        }
      } else {
         // Entire meal was deleted (unlikely but possible)
         const dishesToDelete = await Dish.find({ hostelId, mealType: oldMeal.mealName });
         for (const d of dishesToDelete) {
           await Dish.findOneAndDelete({ _id: d._id });
         }
      }
    }

    hostel.mealPlan = mealPlan;
    hostel.issueCategories = issueCategories;

    await hostel.save();

    return res.status(200).json({ 
      message: 'Settings updated successfully',
      mealPlan: hostel.mealPlan,
      issueCategories: hostel.issueCategories
    });
};

export const previewMenuConstraints = async (req: Request, res: Response) => {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ message: 'text is required' });
    }

    const dishes = await Dish.find({ hostelId: req.user!.hostelId, status: 'ACTIVE' })
      .select('_id name mealType tags')
      .lean();
    const catalog = dishes.map(d => ({ id: d._id.toString(), name: d.name, mealType: d.mealType, tags: d.tags }));

    const { rules, preview } = await parseMenuConstraints(text, catalog);
    const validDishIds = new Set(catalog.map(d => d.id));
    const { valid, errors } = validateConstraints(rules, validDishIds);

    const constraints = rules; // Map rules to constraints for backwards compatibility

    if (!valid) {
      return res.status(422).json({ message: 'Could not produce a consistent rule set', errors, constraints, preview });
    }

    return res.json({ constraints, preview });
};

export const confirmMenuConstraints = async (req: Request, res: Response) => {
    const { text, constraints } = req.body; 
    if (!Array.isArray(constraints)) {
      return res.status(400).json({ message: 'constraints array is required' });
    }

    await Hostel.updateOne(
      { _id: req.user!.hostelId },
      { menuConstraintsText: text, menuConstraints: constraints, menuConstraintsUpdatedAt: new Date() }
    );

    await ActivityLog.create({
      hostelId: req.user!.hostelId,
      userId: req.user!._id,
      action: 'Updated menu constraints',
    });

    return res.json({ message: 'Saved' });
};

export const deleteHostel = async (req: Request, res: Response) => {
    return res.status(200).json({ message: 'Hostel deleted' });
};
