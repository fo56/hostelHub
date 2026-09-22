import mongoose from 'mongoose';

const daySlotSchema = new mongoose.Schema(
  {
    status: { type: String, enum: ['SCHEDULED', 'CLOSED'], default: 'SCHEDULED' },
    fixedItems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Dish' }],
    rotatingItems: [{ 
      category: String,
      item: { type: mongoose.Schema.Types.ObjectId, ref: 'Dish' }
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
    status: { type: String, enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'], default: 'DRAFT' },
    variantLabel: { type: String }, 
    effectiveFrom: { type: Date, default: null },
    effectiveTo: { type: Date, default: null },
    meals: [{
      mealName: { type: String, required: true },
      slots: [daySlotSchema]
    }],
    publishMethod: { type: String, enum: ['AUTO', 'MANUAL'], default: 'MANUAL' },
    solverFailures: [{ type: String }],
    generatedAt: { type: Date, default: Date.now },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

messMenuSchema.index({ hostelId: 1, status: 1 });
messMenuSchema.index({ hostelId: 1, effectiveFrom: -1 });

export const MessMenu = mongoose.model('MessMenu', messMenuSchema);
