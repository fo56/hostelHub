import mongoose from 'mongoose';

const menuVoteSchema = new mongoose.Schema(
  {
    hostelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    dishId: { type: mongoose.Schema.Types.ObjectId, ref: 'Dish', required: true },
    week: { type: Number, required: true },

    rating: { type: Number, min: 1, max: 5 },
    wantAgain: { type: Boolean }
  },
  { timestamps: true }
);

// One vote per dish per user per week
menuVoteSchema.index(
  { hostelId: 1, userId: 1, dishId: 1, week: 1 },
  { unique: true }
);


export const MenuVote = mongoose.model('MenuVote', menuVoteSchema);