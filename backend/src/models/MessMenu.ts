// models/MessMenu.ts
import mongoose from 'mongoose';

const messMenuSchema = new mongoose.Schema(
  {
    hostelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hostel',
      required: true
    },

    week: {
      type: Number,
      required: true
    },

    breakfast: [{
      dishId: { type: mongoose.Schema.Types.ObjectId, ref: 'Dish' },
      score: Number
    }],

    lunch: [{
      dishId: { type: mongoose.Schema.Types.ObjectId, ref: 'Dish' },
      score: Number
    }],

    dinner: [{
      dishId: { type: mongoose.Schema.Types.ObjectId, ref: 'Dish' },
      score: Number
    }],

    generatedAt: {
      type: Date,
      required: true
    },

    published: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// one menu per hostel per week
messMenuSchema.index({ hostelId: 1, week: 1 }, { unique: true });

export const MessMenu = mongoose.model('MessMenu', messMenuSchema);
