// when the admins open a voting window for a particular week
import mongoose from 'mongoose';

const menuVoteWindowSchema = new mongoose.Schema(
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
    startsAt: {
      type: Date,
      required: true
    },
    endsAt: {
      type: Date,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // ADMIN
      required: true
    }
  },
  { timestamps: true }
);

// Only ONE voting window per hostel per week
menuVoteWindowSchema.index(
  { hostelId: 1, week: 1 },
  { unique: true }
);

export const MenuVoteWindow = mongoose.model(
  'MenuVoteWindow',
  menuVoteWindowSchema
);
