import { redis } from '../lib/redis';
import { config } from '../config';

export interface RateLimitResult {
  allowed: boolean;
  currentCount: number;
  limit: number;
  remaining: number;
  resetTimeMs: number;
  delayUntilResetMs: number;
  sender: string;
}

export class RateLimiterService {
  private static instance: RateLimiterService;

  private constructor() {}

  public static getInstance(): RateLimiterService {
    if (!RateLimiterService.instance) {
      RateLimiterService.instance = new RateLimiterService();
    }
    return RateLimiterService.instance;
  }

  /**
   * Normalizes a sender string (e.g. "ReachInbox <sales@reachinbox.ai>" -> "sales@reachinbox.ai")
   */
  public static normalizeSender(sender: string): string {
    const match = sender.match(/<([^>]+)>/);
    const email = match ? match[1] : sender;
    return email.toLowerCase().trim();
  }

  /**
   * Returns window boundaries and Redis key for a given sender.
   * Key pattern: ratelimit:sender:{normalizedSender}:{windowStartTimestamp}
   */
  private getWindowInfo(sender: string): { key: string; normalizedSender: string; windowStartMs: number; nextWindowStartMs: number } {
    const windowMs = config.rateLimitWindowMs;
    const now = Date.now();
    const windowStartMs = Math.floor(now / windowMs) * windowMs;
    const nextWindowStartMs = windowStartMs + windowMs;
    const normalizedSender = RateLimiterService.normalizeSender(sender);
    const key = `ratelimit:sender:${normalizedSender}:${windowStartMs}`;

    return { key, normalizedSender, windowStartMs, nextWindowStartMs };
  }

  /**
   * Atomically checks and consumes 1 send token for a sender in the current hour window.
   * If limit is exceeded, rolls back the count and returns allowed=false with delayUntilResetMs.
   */
  public async checkAndConsume(sender: string, hourlyLimit: number): Promise<RateLimitResult> {
    const { key, normalizedSender, nextWindowStartMs } = this.getWindowInfo(sender);
    const now = Date.now();
    const delayUntilResetMs = Math.max(1000, nextWindowStartMs - now + 500); // 500ms safety buffer
    const windowSeconds = Math.ceil((config.rateLimitWindowMs * 2) / 1000); // 2x window TTL (7200s for 1h)

    // Lua script: atomically increments. If <= limit, allows; if > limit, decrements back and denies.
    const luaScript = `
      local current = redis.call('INCR', KEYS[1])
      if current == 1 then
        redis.call('EXPIRE', KEYS[1], tonumber(ARGV[2]))
      end
      if current > tonumber(ARGV[1]) then
        redis.call('DECR', KEYS[1])
        return { 0, current - 1 }
      else
        return { 1, current }
      end
    `;

    try {
      const result = (await redis.eval(luaScript, 1, key, hourlyLimit, windowSeconds)) as [number, number];
      const isAllowed = result[0] === 1;
      const count = result[1];

      return {
        allowed: isAllowed,
        currentCount: count,
        limit: hourlyLimit,
        remaining: isAllowed ? Math.max(0, hourlyLimit - count) : 0,
        resetTimeMs: nextWindowStartMs,
        delayUntilResetMs: isAllowed ? 0 : delayUntilResetMs,
        sender: normalizedSender,
      };
    } catch (err: any) {
      console.error(`[RateLimiter] Error executing Lua script for sender ${normalizedSender}:`, err.message);
      // Fail open safely on unexpected Redis error
      return {
        allowed: true,
        currentCount: 0,
        limit: hourlyLimit,
        remaining: hourlyLimit,
        resetTimeMs: nextWindowStartMs,
        delayUntilResetMs: 0,
        sender: normalizedSender,
      };
    }
  }

  /**
   * Inspects current usage for a sender without consuming a token.
   */
  public async getUsage(sender: string, hourlyLimit: number): Promise<RateLimitResult> {
    const { key, normalizedSender, nextWindowStartMs } = this.getWindowInfo(sender);
    const now = Date.now();
    const delayUntilResetMs = Math.max(0, nextWindowStartMs - now);

    try {
      const val = await redis.get(key);
      const currentCount = val ? parseInt(val, 10) : 0;
      const allowed = currentCount < hourlyLimit;

      return {
        allowed,
        currentCount,
        limit: hourlyLimit,
        remaining: Math.max(0, hourlyLimit - currentCount),
        resetTimeMs: nextWindowStartMs,
        delayUntilResetMs,
        sender: normalizedSender,
      };
    } catch {
      return {
        allowed: true,
        currentCount: 0,
        limit: hourlyLimit,
        remaining: hourlyLimit,
        resetTimeMs: nextWindowStartMs,
        delayUntilResetMs: 0,
        sender: normalizedSender,
      };
    }
  }
}
