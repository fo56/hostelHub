import { logger } from '../utils/logger';
import mongoose from 'mongoose';

export async function connectDB() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hostelHub';
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
  } catch (error) {
    logger.error('APP', 'MongoDB connection failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
};