import mongoose from 'mongoose';

const daySlotSchema = new mongoose.Schema(
  {
    status: { type: String, enum: ['SCHEDULED', 'CLOSED'], default: 'SCHEDULED' },
    fixedItems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Dish' }],
    rotatingItems: [{ 
      category: String,
      item: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuRecommendation' }
    }],
    timing: { start: { type: String }, end: { type: String } },
    overriddenBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    overriddenAt: { type: Date },
  },
  { _id: false }
);

const messMenuSchema = new mongoose.Schema(
  {
    hostelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel', required: true },
    weekOf: { type: Date, required: true },
    meals: [{
      mealName: { type: String, required: true },
      slots: [daySlotSchema]
    }],
    published: { type: Boolean, default: false },
    publishMethod: { type: String, enum: ['AUTO', 'MANUAL'], default: 'MANUAL' },
    solverFailures: [{ type: String }],
    generatedAt: { type: Date, default: Date.now },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

messMenuSchema.index({ hostelId: 1, weekOf: 1 }, { unique: true });
messMenuSchema.index({ hostelId: 1, published: 1 });

export const MessMenu = mongoose.model('MessMenu', messMenuSchema);
