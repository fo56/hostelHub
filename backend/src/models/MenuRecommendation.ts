import mongoose, { Schema } from 'mongoose';

const menuRecommendationSchema = new Schema({
  hostelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel',
    required: true
  },

  week: {
    type: Number,
    required: true
  },

  mealType: {
    type: String,
    enum: ['Breakfast', 'Lunch', 'Dinner'],
    required: true
  },

  dishId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dish',
    required: true
  },

  voteScore: Number,
  healthScore: Number,
  costEfficiency: Number,
  finalScore: Number,

  computedAt: { type: Date, default: Date.now }
});


export const MenuRecommendation = mongoose.model(
  'MenuRecommendation',
  menuRecommendationSchema
);