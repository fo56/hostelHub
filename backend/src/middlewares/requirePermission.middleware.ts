import { NextFunction, Request, Response } from 'express';
import { User } from '../models/User';

export const requirePermission = (requiredPermission: 'MANAGE_USERS' | 'MANAGE_MENU' | 'MANAGE_ISSUES' | 'MANAGE_SETTINGS') => async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }

    const userId = req.user._id || (req.user as any).id;
    const userDoc = await User.findById(userId);
    
    if (!userDoc) {
       return res.status(401).json({ message: 'Unauthorized' });
    }

    if (userDoc.isPrimaryAdmin) {
      return next();
    }

    if (userDoc.permissions && userDoc.permissions.includes(requiredPermission)) {
      return next();
    }

    return res.status(403).json({ message: `Forbidden: Missing permission ${requiredPermission}` });
  } catch (error) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};
