import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    hostelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel', required: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    email: { type: String, lowercase: true, trim: true, default: null },
    name: { type: String, default: null, trim: true },
    passwordHash: { type: String, required: true },
    passwordChangedAt: { type: Date, default: Date.now },
    role: { type: String, enum: ['ADMIN', 'STUDENT'], required: true },
    roomNo: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.index({ hostelId: 1, role: 1, isActive: 1 });

export const User = mongoose.model('User', userSchema);