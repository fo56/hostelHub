import { Types } from 'mongoose';

declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: Types.ObjectId;
        email?: string;
        role: 'STUDENT' | 'ADMIN';
        hostelId: string | Types.ObjectId;
      };
    }
  }
}

export {};
