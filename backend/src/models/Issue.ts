import mongoose from 'mongoose';

const issueSchema = new mongoose.Schema(
  {
    hostelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel', required: true },
    raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    raisedByName: { type: String, required: true },
    roomNo: { type: String, required: true },
    category: { type: String, required: true },
    priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], required: true },
    status: { type: String, enum: ['OPEN', 'RESOLVED', 'CLOSED'], default: 'OPEN' },
    description: { type: String, required: true },
    resolverNote: { type: String },
  },
  { timestamps: true }
);

issueSchema.index({ hostelId: 1, status: 1, category: 1 });

export const Issue = mongoose.model('Issue', issueSchema);