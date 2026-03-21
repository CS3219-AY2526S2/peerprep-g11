import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import assistantRoutes from './routes/assistant.routes';
import { globalAuditLogger } from './middleware/auditLogger';
import { authenticate } from './middleware/authenticate';

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use(authenticate);
app.use(globalAuditLogger);
app.use('/assistant', assistantRoutes);

export default app;
