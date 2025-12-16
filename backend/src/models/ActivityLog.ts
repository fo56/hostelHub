import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  ip: { type: String },
  timestamp: { type: Date, default: Date.now }
});

export const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);