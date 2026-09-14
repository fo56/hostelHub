import { logger } from '../utils/logger';
import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('APP', err);

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    res.status(409).json({ message: `A record with that ${field} already exists.` });
    return;
  }

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val: any) => val.message);
    res.status(400).json({ message: messages.join('. ') });
    return;
  }

  res.status(err.status || 500).json({
    message: err.message || 'Internal server error'
  });
};
