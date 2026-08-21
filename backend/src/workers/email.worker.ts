import { Worker, Job } from 'bullmq';
import { EMAIL_QUEUE_NAME, EmailJobPayload, emailQueue } from '../queues/email.queue';
import { createRedisClient } from '../lib/redis';
import { prisma } from '../lib/prisma';
import { config } from '../config';
import { EmailService } from '../services/email.service';
import { RateLimiterService } from '../services/rate-limiter.service';
import { EmailStatus } from '@prisma/client';

console.log('====================================================');
console.log('🚀 Starting Dedicated BullMQ Email Worker Process...');
console.log(`⚡ Queue:               ${EMAIL_QUEUE_NAME}`);
console.log(`⚡ Worker Concurrency:  ${config.workerConcurrency}`);
console.log(`⚡ Rate Limit Window:   ${config.rateLimitWindowMs}ms (${config.rateLimitWindowMs / 3600000} hr)`);
console.log(`⚡ Rate Limit Scope:    PER-SENDER (shared across campaigns by same sender)`);
console.log(`⚡ Redis:               ${config.redisUrl}`);
console.log(`⚡ Email Provider:      ${config.emailProvider.toUpperCase()} (${config.emailProvider === 'resend' ? 'Resend HTTP API' : `${config.smtp.host}:${config.smtp.port}`})`);
console.log('====================================================');

const workerRedisClient = createRedisClient();
const emailService = EmailService.getInstance();
const rateLimiter = RateLimiterService.getInstance();

// Active jobs counter for live concurrency verification
let activeJobsCount = 0;

export const emailWorker = new Worker<EmailJobPayload>(
  EMAIL_QUEUE_NAME,
  async (job: Job<EmailJobPayload>) => {
    activeJobsCount++;
    const { emailId } = job.data;
    console.log(
      `[Worker] ▶️ [JOB START] Job ${job.id} for Email ${emailId} | Active Jobs: ${activeJobsCount}/${config.workerConcurrency}`
    );

    try {
      // 1. Fetch Email record from PostgreSQL (including parent Campaign)
      const emailRecord = await prisma.email.findUnique({
        where: { id: emailId },
        include: {
          campaign: true,
        },
      });

      if (!emailRecord) {
        console.warn(`[Worker] Email ID ${emailId} not found in PostgreSQL. Skipping job.`);
        return { skipped: true, reason: 'Email record not found in PostgreSQL' };
      }

      // 2. Status check & idempotency handling
      if (emailRecord.status === EmailStatus.SENT) {
        console.log(`[Worker] Email ID ${emailId} is already marked as SENT. Skipping to ensure idempotency.`);
        return { skipped: true, reason: 'Already sent' };
      }

      // 3. Per-Sender Hourly Rate-Limiting Check (shared across all campaigns for this sender)
      const campaign = emailRecord.campaign;
      const rateCheck = await rateLimiter.checkAndConsume(campaign.sender, campaign.hourlyLimit);

      if (!rateCheck.allowed) {
        console.log(
          `[Worker] ⏳ [SENDER RATE LIMIT EXCEEDED] Sender "${rateCheck.sender}" has reached its limit (${rateCheck.currentCount}/${campaign.hourlyLimit} emails/window).`
        );
        console.log(
          `[Worker] ⏳ Rescheduling Email ${emailId} to next window (+${Math.round(rateCheck.delayUntilResetMs / 1000)}s) without marking as FAILED.`
        );

        // Keep status as PENDING (or revert from PROCESSING to PENDING)
        await prisma.email.update({
          where: { id: emailId },
          data: {
            status: EmailStatus.PENDING,
            // Do not populate errorMessage because rate-limiting is normal queue throttling
          },
        });

        // Re-enqueue delayed into the next window with unique retry jobId
        const retryJobId = `${emailId}-rate-retry-${rateCheck.resetTimeMs}`;
        await emailQueue.add(
          'send-email',
          { emailId },
          {
            jobId: retryJobId,
            delay: rateCheck.delayUntilResetMs,
            attempts: 3,
          }
        );

        return {
          rateLimited: true,
          sender: rateCheck.sender,
          campaignId: campaign.id,
          limit: campaign.hourlyLimit,
          rescheduledDelayMs: rateCheck.delayUntilResetMs,
          nextWindowDate: new Date(rateCheck.resetTimeMs).toISOString(),
        };
      }

      // 4. Mark status as PROCESSING in PostgreSQL and increment attempts
      await prisma.email.update({
        where: { id: emailId },
        data: {
          status: EmailStatus.PROCESSING,
          attempts: { increment: 1 },
        },
      });

      // 5. Send real email via Nodemailer & Ethereal SMTP with specific campaign sender
      console.log(
        `[Worker] ✉️ [DISPATCHING SMTP] From: "${campaign.sender}" -> To: "${emailRecord.recipientEmail}" | Subject: "${campaign.subject}"`
      );

      const sendResult = await emailService.sendEmail({
        from: campaign.sender,
        to: emailRecord.recipientEmail,
        subject: campaign.subject,
        text: campaign.body,
      });

      // 6. Update PostgreSQL status to SENT with sentAt timestamp
      const updated = await prisma.email.update({
        where: { id: emailId },
        data: {
          status: EmailStatus.SENT,
          sentAt: new Date(),
          errorMessage: null,
        },
      });

      console.log(`[Worker] ✅ Email ID ${emailId} successfully sent via Sender "${campaign.sender}"!`);
      console.log(`[Worker] 📬 Message ID:  ${sendResult.messageId}`);
      if (sendResult.previewUrl) {
        console.log(`[Worker] 🔗 Preview URL: ${sendResult.previewUrl}`);
      }

      return {
        success: true,
        emailId: updated.id,
        sender: campaign.sender,
        recipient: updated.recipientEmail,
        messageId: sendResult.messageId,
        previewUrl: sendResult.previewUrl,
        sentAt: updated.sentAt,
      };
    } catch (error: any) {
      console.error(`[Worker] ❌ Failed to dispatch email ID ${emailId} via SMTP:`, error.message);

      // Only mark permanently as FAILED when all BullMQ attempts are exhausted
      const isFinalAttempt = (job.attemptsMade + 1) >= (job.opts.attempts || 1);

      await prisma.email.update({
        where: { id: emailId },
        data: {
          status: isFinalAttempt ? EmailStatus.FAILED : EmailStatus.PENDING,
          errorMessage: error.message || 'SMTP dispatch error',
        },
      });

      // Re-throw so BullMQ records the failure and triggers backoff
      throw error;
    } finally {
      activeJobsCount--;
      console.log(
        `[Worker] ⏹️ [JOB END] Job ${job.id} finished | Active Jobs: ${activeJobsCount}/${config.workerConcurrency}`
      );
    }
  },
  {
    connection: workerRedisClient,
    concurrency: config.workerConcurrency,
  }
);

// Worker Event Listeners
emailWorker.on('active', (job) => {
  console.log(`[Worker Event] Job ${job.id} is actively executing`);
});

emailWorker.on('completed', (job, result) => {
  console.log(`[Worker Event] Job ${job.id} completed. RateLimited: ${result?.rateLimited ? 'YES (Rescheduled)' : 'NO'}`);
});

emailWorker.on('failed', (job, err) => {
  console.error(`[Worker Event] Job ${job?.id} failed:`, err.message);
});

emailWorker.on('error', (err) => {
  console.error('[Worker Event] System error in worker:', err.message);
});

// Initialize SMTP transporter on worker startup
emailService.initialize().catch((err) => {
  console.error('[Worker] Initial SMTP connection warning:', err.message);
});

// Graceful Shutdown
async function shutdown(signal: string) {
  console.log(`[Worker] Received ${signal}. Closing BullMQ worker gracefully...`);
  await emailWorker.close();
  await workerRedisClient.quit();
  await prisma.$disconnect();
  console.log('[Worker] Worker shutdown complete. Goodbye!');
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
