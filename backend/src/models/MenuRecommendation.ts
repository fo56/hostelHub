import mongoose, { Schema } from 'mongoose';

const menuRecommendationSchema = new Schema({
  hostelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel', required: true },
  mealName: { type: String, required: true },
  categoryName: { type: String, required: true },
  dishId: { type: mongoose.Schema.Types.ObjectId, ref: 'Dish', required: true },
  voteScore: Number,
  healthScore: Number,
  costEfficiency: Number,
  finalScore: Number,
  computedAt: { type: Date, default: Date.now },
});

menuRecommendationSchema.index({ hostelId: 1, mealName: 1, categoryName: 1, finalScore: -1 });

export const MenuRecommendation = mongoose.model('MenuRecommendation', menuRecommendationSchema);