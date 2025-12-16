import mongoose from 'mongoose';

const menuVoteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dishId: { type: mongoose.Schema.Types.ObjectId, ref: 'Dish', required: true },
  week: { type: Number, required: true },
  rating: { type: Number, min: 1, max: 5 },
  wantAgain: { type: Boolean },
  createdAt: { type: Date, default: Date.now }
});

export const MenuVote = mongoose.model('MenuVote', menuVoteSchema);