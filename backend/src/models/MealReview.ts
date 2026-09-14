import mongoose from 'mongoose';

const mealReviewSchema = new mongoose.Schema(
  {
    hostelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    dishId: { type: mongoose.Schema.Types.ObjectId, ref: 'Dish', required: true },
    mealType: { type: String, enum: ['Breakfast', 'Lunch', 'Snack', 'Dinner'], required: true },
    servedOn: { type: Date, required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, maxlength: 500 },
    images: [{ type: String }],
  },
  { timestamps: true }
);

mealReviewSchema.index({ hostelId: 1, studentId: 1, dishId: 1, servedOn: 1 }, { unique: true });
mealReviewSchema.index({ hostelId: 1, dishId: 1 });

export const MealReview = mongoose.model('MealReview', mealReviewSchema);
