import { Router, Request, Response } from 'express';
import { getQueueStatus } from '../queues/email.queue';
import { config } from '../config';

export const queueRouter = Router();

// GET /api/queue/status
queueRouter.get('/status', async (req: Request, res: Response) => {
  try {
    const queueData = await getQueueStatus();
    return res.status(200).json({
      status: 'success',
      data: {
        ...queueData,
        workerConcurrency: config.workerConcurrency,
        rateLimitWindowMs: config.rateLimitWindowMs,
        rateLimitWindowDescription: `${config.rateLimitWindowMs / 3600000} hour(s)`,
      },
    });
  } catch (error: any) {
    console.error('Error fetching queue status:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve queue status',
      error: error.message,
    });
  }
});
