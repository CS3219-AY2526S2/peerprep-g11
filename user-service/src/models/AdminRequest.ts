import mongoose, { Document, Schema } from 'mongoose';

export interface IAdminRequest extends Document {
  userId: mongoose.Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const adminRequestSchema = new Schema<IAdminRequest>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

adminRequestSchema.index({ userId: 1, status: 1 });

export const AdminRequest = mongoose.model<IAdminRequest>('AdminRequest', adminRequestSchema);
