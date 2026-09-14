import mongoose from 'mongoose';

const dishSchema = new mongoose.Schema(
  {
    hostelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel', required: true },
    name: { type: String, required: true, trim: true },
    mealType: { type: String, required: true },
    category: { type: String, required: true },
    priceScore: { type: Number, min: 1, max: 5 },
    healthScore: { type: Number, min: 1, max: 5 },
    itemClass: { type: String, enum: ['FIXED', 'ROTATING'], default: 'ROTATING' },
    defaultQuantity: { type: String },
    tags: [{ type: String }],
    status: { type: String, enum: ['UNDER_REVIEW', 'ACTIVE', 'INACTIVE'], default: 'UNDER_REVIEW' },
    suggestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

dishSchema.index({ hostelId: 1, status: 1, mealType: 1 });
dishSchema.index({ hostelId: 1, name: 1 });

export const Dish = mongoose.model('Dish', dishSchema);