import express from 'express';
import cors from 'cors';
import { clerkMiddleware } from '@clerk/express';
import { config } from './config';
import { healthRouter } from './routes/health.routes';
import { campaignRouter } from './routes/campaign.routes';
import { queueRouter } from './routes/queue.routes';
import { emailRouter } from './routes/email.routes';
import { authRouter } from './routes/auth.routes';

const app = express();

app.use(cors());
app.use(express.json());

// Clerk middleware — processes session tokens on every request.
// This does NOT block unauthenticated requests; it only populates req.auth.
// Individual routes use requireAuth middleware to enforce authentication.
app.use(clerkMiddleware());

// Register health routes (accessible at /health, /health/db, /health/redis) — public
app.use('/', healthRouter);

// Register Auth routes (protected by requireAuth inside the router)
app.use('/api/auth', authRouter);

// Register Campaign API routes — currently public, can be protected later
app.use('/api/campaigns', campaignRouter);

// Register Email listing & filtering API routes
app.use('/api/emails', emailRouter);

// Register Queue API routes
app.use('/api/queue', queueRouter);

const server = app.listen(config.port, () => {
  console.log(`Backend server running on http://localhost:${config.port}`);
  console.log(`Health check:    http://localhost:${config.port}/health`);
  console.log(`DB check:        http://localhost:${config.port}/health/db`);
  console.log(`Redis check:     http://localhost:${config.port}/health/redis`);
  console.log(`Auth (protected):http://localhost:${config.port}/api/auth/me`);
  console.log(`Campaigns API:   http://localhost:${config.port}/api/campaigns`);
  console.log(`Emails API:      http://localhost:${config.port}/api/emails`);
  console.log(`Queue Status:    http://localhost:${config.port}/api/queue/status`);
});

export default app;
