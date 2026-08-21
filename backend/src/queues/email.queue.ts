import { Queue } from 'bullmq';
import { redisConnectionOptions } from '../lib/redis';

export const EMAIL_QUEUE_NAME = 'email-sending';

export interface EmailJobPayload {
  emailId: string;
}

export const emailQueue = new Queue<EmailJobPayload>(EMAIL_QUEUE_NAME, {
  connection: redisConnectionOptions,
  defaultJobOptions: {
    attempts: 4, // Retry up to 4 times on transient failures
    backoff: {
      type: 'exponential',
      delay: 5000, // 5s initial exponential backoff to avoid collision waves
    },
    removeOnComplete: {
      count: 100, // Keep last 100 completed jobs for inspection
      age: 3600,  // Keep completed jobs for up to 1 hour
    },
    removeOnFail: {
      count: 500,  // Keep up to 500 failed jobs for debugging
      age: 86400,  // Keep failed jobs for up to 24 hours
    },
  },
});

emailQueue.on('error', (err) => {
  console.error(`[BullMQ:${EMAIL_QUEUE_NAME}] Queue error:`, err.message);
});

/**
 * Enqueues a single email job with BullMQ delayed scheduling and idempotency.
 */
export async function addEmailJob(emailId: string, scheduledAt: Date) {
  const now = Date.now();
  const scheduledTimeMs = scheduledAt.getTime();
  const delayMs = Math.max(0, scheduledTimeMs - now);

  return await emailQueue.add(
    'send-email',
    { emailId },
    {
      jobId: emailId, // Enforces 1-to-1 idempotency with PostgreSQL Email.id
      delay: delayMs,
      attempts: 4,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    }
  );
}

/**
 * High-performance bulk enqueuing for campaigns with 1000+ recipients using BullMQ addBulk.
 * Submits all delayed jobs in a single atomic Redis pipeline.
 */
export async function addEmailJobsBulk(jobs: Array<{ emailId: string; scheduledAt: Date }>) {
  const now = Date.now();
  const bulkItems = jobs.map((job) => {
    const delayMs = Math.max(0, job.scheduledAt.getTime() - now);
    return {
      name: 'send-email',
      data: { emailId: job.emailId },
      opts: {
        jobId: job.emailId, // Enforces 1-to-1 idempotency with PostgreSQL Email.id
        delay: delayMs,
        attempts: 4,
        backoff: {
          type: 'exponential' as const,
          delay: 5000,
        },
      },
    };
  });

  return await emailQueue.addBulk(bulkItems);
}

/**
 * Returns current job status counts for health/inspection.
 */
export async function getQueueStatus() {
  const counts = await emailQueue.getJobCounts(
    'waiting',
    'active',
    'delayed',
    'completed',
    'failed',
    'paused'
  );

  return {
    queueName: EMAIL_QUEUE_NAME,
    counts,
  };
}
