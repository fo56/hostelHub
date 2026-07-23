import mongoose, { Schema, Document } from 'mongoose';

export interface IStudentVote extends Document {
  hostelId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  breakfast: mongoose.Types.ObjectId[];
  lunch: mongoose.Types.ObjectId[];
  dinner: mongoose.Types.ObjectId[];
  updatedAt: Date;
}

const StudentVoteSchema = new Schema<IStudentVote>(
  {
    hostelId: { type: Schema.Types.ObjectId, ref: 'Hostel', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    breakfast: [{ type: Schema.Types.ObjectId, ref: 'Dish' }],
    lunch: [{ type: Schema.Types.ObjectId, ref: 'Dish' }],
    dinner: [{ type: Schema.Types.ObjectId, ref: 'Dish' }]
  },
  { timestamps: true }
);

export const StudentVote = mongoose.model<IStudentVote>('StudentVote', StudentVoteSchema);