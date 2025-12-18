import { Request, Response, NextFunction } from 'express';

export const requireRole =
  (...allowedRoles: Array<'STUDENT' | 'ADMIN' | 'WORKER'>) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    next();
  };
