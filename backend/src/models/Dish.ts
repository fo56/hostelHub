import mongoose from 'mongoose';

const dishSchema = new mongoose.Schema({
  hostelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel', required: true },
  name: { type: String, required: true },
  mealType: { type: String, required: true },
  category: { type: String, required: true },
  priceScore: { type: Number, min: 1, max: 5 },
  healthScore: { type: Number, min: 1, max: 5 },
  tags: [{ type: String }],
  status: { type: String, enum: ['UNDER_REVIEW', 'ACTIVE', 'INACTIVE'], default: 'UNDER_REVIEW' },
  suggestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

export const Dish = mongoose.model('Dish', dishSchema);