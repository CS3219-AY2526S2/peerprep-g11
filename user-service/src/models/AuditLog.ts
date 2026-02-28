import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
  actorId: { type: String, required: true, immutable: true },
  actorRole: { type: String, required: true, immutable: true },
  actionType: { type: String, required: true, immutable: true }, // e.g., 'USER_DELETE'
  targetEntityType: { type: String, required: true, immutable: true }, // e.g., 'USER'
  targetEntityId: { type: String, required: true, immutable: true },
  operationStatus: { 
    type: String, 
    enum: ['SUCCESS', 'FAILURE'], 
    required: true, 
    immutable: true 
  },
  timestamp: { type: Date, default: Date.now, immutable: true },
  details: { type: Object, immutable: true }
});

export const AuditLog = mongoose.model('AuditLog', AuditLogSchema);