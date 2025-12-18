import { Types } from 'mongoose';

declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: Types.ObjectId;
        role: 'STUDENT' | 'ADMIN' | 'WORKER';
        hostelId: Types.ObjectId;
      };
    }
  }
}

export {};
