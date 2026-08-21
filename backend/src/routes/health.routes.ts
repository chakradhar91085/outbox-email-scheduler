import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';

export const healthRouter = Router();

// Basic backend health check
healthRouter.get('/health', (req: Request, res: Response) => {
  return res.status(200).json({
    status: 'ok',
    message: 'Backend is running',
  });
});

// Database connectivity health check
healthRouter.get('/health/db', async (req: Request, res: Response) => {
  try {
    // Run a lightweight raw query to test Postgres connection
    await prisma.$queryRaw`SELECT 1`;
    return res.status(200).json({
      status: 'ok',
      message: 'PostgreSQL database connected successfully via Prisma',
    });
  } catch (error: any) {
    return res.status(503).json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message || 'Unable to connect to PostgreSQL',
    });
  }
});

// Redis connectivity health check
healthRouter.get('/health/redis', async (req: Request, res: Response) => {
  try {
    if (redis.status !== 'ready' && redis.status !== 'connecting' && redis.status !== 'connect') {
      await redis.connect();
    }
    const pong = await redis.ping();
    return res.status(200).json({
      status: 'ok',
      message: 'Redis connected successfully',
      response: pong,
    });
  } catch (error: any) {
    return res.status(503).json({
      status: 'error',
      message: 'Redis connection failed',
      error: error.message || 'Unable to ping Redis',
    });
  }
});
