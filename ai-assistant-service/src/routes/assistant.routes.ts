import { Router } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import { handleExplainRequest } from '../assistant/explain.service';
import { handleHintsRequest } from '../assistant/hints.service';
import { handleTranslateRequest } from '../assistant/translate.service';

const router = Router();

router.get('/ping', (req: AuthRequest, res) => {
  const user = req.user
    ? {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
      }
    : null;

  res.json({
    message: 'AI assistant service is ready',
    user,
  });
});

router.post('/explain', (req, res) => {
  void handleExplainRequest(req, res);
});

router.post('/hints', (req, res) => {
  void handleHintsRequest(req, res);
});

router.post('/translate', (req, res) => {
  void handleTranslateRequest(req, res);
});

export default router;
