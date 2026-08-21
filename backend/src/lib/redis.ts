import Redis, { RedisOptions } from 'ioredis';
import { config } from '../config';

export function parseRedisUrl(urlStr: string): RedisOptions {
  try {
    const url = new URL(urlStr);
    return {
      host: url.hostname || '127.0.0.1',
      port: parseInt(url.port || '6379', 10),
      password: url.password || undefined,
      maxRetriesPerRequest: null, // Required by BullMQ
      enableReadyCheck: false,
    };
  } catch {
    return {
      host: '127.0.0.1',
      port: 6379,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    };
  }
}

export const redisConnectionOptions = parseRedisUrl(config.redisUrl);

// Standalone Redis client for general health checks
export const redis = new Redis(config.redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  lazyConnect: true,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on('connect', () => {
  console.log('[Redis] Connected successfully');
});

redis.on('error', (err) => {
  console.error('[Redis] Connection error:', err.message);
});

// Helper to create a fresh Redis connection for BullMQ
export function createRedisClient(): Redis {
  return new Redis(config.redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
}
