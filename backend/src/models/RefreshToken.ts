import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now, expires: 2592000 },
});

refreshTokenSchema.index({ userId: 1 });

export const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);
