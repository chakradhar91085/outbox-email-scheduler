import { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';

/**
 * Middleware that requires a valid Clerk authentication token.
 * Returns 401 for unauthenticated requests instead of redirecting.
 * Designed for API-only routes where the frontend is a separate SPA.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = getAuth(req);

  if (!auth.userId) {
    return res.status(401).json({
      status: 'error',
      message: 'Authentication required. Please sign in.',
    });
  }

  next();
}
