import { Router } from 'express';
import { EmailController } from '../controllers/email.controller';

export const emailRouter = Router();

// GET /api/emails (supports ?status=PENDING, ?status=SENT, ?campaignId=..., ?page=1, ?limit=50)
emailRouter.get('/', EmailController.getEmails);
