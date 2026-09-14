import mongoose, { Schema, Document } from 'mongoose';

export interface IStudentVote extends Document {
  hostelId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  votes: {
    mealName: string;
    categoryName: string;
    dishes: mongoose.Types.ObjectId[];
  }[];
  wantsNewMenu: boolean;
}

const StudentVoteSchema = new Schema<IStudentVote>(
  {
    hostelId: { type: Schema.Types.ObjectId, ref: 'Hostel', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    votes: [{
      mealName: { type: String, required: true },
      categoryName: { type: String, required: true },
      dishes: [{ type: Schema.Types.ObjectId, ref: 'Dish' }]
    }],
    wantsNewMenu: { type: Boolean, default: false },
  },
  { timestamps: true }
);

StudentVoteSchema.index({ hostelId: 1, wantsNewMenu: 1 });

export const StudentVote = mongoose.model<IStudentVote>('StudentVote', StudentVoteSchema);