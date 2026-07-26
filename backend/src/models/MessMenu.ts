import mongoose from 'mongoose';

const mealArrayValidator = {
  validator: (arr: any[]) => arr.length === 7,
  message: 'Each meal must have exactly 7 dishes'
};

const MessMenuSchema = new mongoose.Schema({
  hostelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel',
    required: true
  },


  breakfast: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'MenuRecommendation',
    required: true,
    validate: mealArrayValidator
  },

  lunch: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'MenuRecommendation',
    required: true,
    validate: mealArrayValidator
  },

  dinner: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'MenuRecommendation',
    required: true,
    validate: mealArrayValidator
  },

  generatedAt: {
    type: Date,
    default: Date.now
  },

  published: {
    type: Boolean,
    default: false
  }
},
{
  timestamps: true
});

// Prevent duplicate menus per hostel per week
MessMenuSchema.index(
  { hostelId: 1 },
  { unique: true }
);

export const MessMenu = mongoose.model('MessMenu', MessMenuSchema);
