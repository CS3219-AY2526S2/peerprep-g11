// middleware/auditLogger.ts
import { Request, Response, NextFunction } from 'express';
import { AuditLog } from '../models/AuditLog';

export const globalAuditLogger = async (req: Request, res: Response, next: NextFunction) => {
  // We wait for the request to finish so we know the status code
  res.on('finish', async () => {
    // 1. Identify the Actor
    // (Assuming your auth middleware has already run and populated req.user)
    const user = (req as any).user;
    
    // 2. Define what is worth logging 
    // We usually ignore GET requests to keep the DB from exploding, 
    // focusing on POST, PUT, DELETE (State changes)
    if (req.method === 'GET') return;

    try {
      await AuditLog.create({
        actorId: user?._id || 'ANONYMOUS',
        actorRole: user?.role || 'GUEST',
        actionType: `${req.method} ${req.originalUrl}`,
        targetEntityType: req.originalUrl.split('/')[2] || 'UNKNOWN', // Infers type from URL (e.g., /api/users -> USER)
        targetEntityId: req.params.id || 'N/A',
        operationStatus: res.statusCode < 400 ? 'SUCCESS' : 'FAILURE',
        timestamp: new Date(),
      });
    } catch (err) {
      console.error('Audit Log Error:', err);
    }
  });

  next();
};