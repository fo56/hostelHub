import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  hostelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel', required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  registrationNo: { type: String, sparse: true },
  role: { type: String, enum: ['ADMIN', 'STUDENT', 'WORKER'], required: true },
  roomNo: { type: String },
  jobType: { type: String },
  qrToken: { type: String, unique: true, sparse: true },
  passwordHash: { type: String },
  isPasswordSet: { type: Boolean, default: false },
  emailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String, sparse: true },
  emailVerificationExpires: { type: Date },
  loginURL: { type: String, sparse: true, unique: true },
  loginURLExpires: { type: Date },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.model('User', userSchema);