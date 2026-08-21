import dotenv from 'dotenv';

// Load .env before any module reads process.env (Clerk SDK reads CLERK_* directly)
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/email_scheduler?schema=public',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  frontendUrl: process.env.FRONTEND_URL || '',
  workerConcurrency: Math.max(1, parseInt(process.env.WORKER_CONCURRENCY || '5', 10)),
  
  // Rate limit window in milliseconds (Default: 1 hour = 3600000 ms)
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '3600000', 10),

  // Email Provider Selection ('ethereal' by default for assessment compliance, 'resend' optional)
  emailProvider: (process.env.EMAIL_PROVIDER || 'ethereal').toLowerCase(),
  resendApiKey: process.env.RESEND_API_KEY || '',

  // SMTP / Ethereal Email Configuration
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'ReachInbox Scheduler <noreply@reachinbox.ai>',
  },
};
