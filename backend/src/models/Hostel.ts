import mongoose from 'mongoose';

const hostelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  domain: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now }
});

export const Hostel = mongoose.model('Hostel', hostelSchema);