import mongoose, { Document, Schema } from 'mongoose';

export interface IDemotionVoteEntry {
  voterId: mongoose.Types.ObjectId;
  vote: 'yes' | 'no';
  votedAt: Date;
}

export interface IDemotionVote extends Document {
  targetUserId: mongoose.Types.ObjectId;
  initiatorId: mongoose.Types.ObjectId;
  status: 'active' | 'approved' | 'rejected' | 'expired';
  votes: IDemotionVoteEntry[];
  requiredVotes: number;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const demotionVoteSchema = new Schema<IDemotionVote>(
  {
    targetUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    initiatorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'approved', 'rejected', 'expired'],
      default: 'active',
    },
    votes: [
      {
        voterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        vote: { type: String, enum: ['yes', 'no'], required: true },
        votedAt: { type: Date, default: Date.now },
      },
    ],
    requiredVotes: {
      type: Number,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

demotionVoteSchema.index({ targetUserId: 1, status: 1 });

export const DemotionVote = mongoose.model<IDemotionVote>('DemotionVote', demotionVoteSchema);
