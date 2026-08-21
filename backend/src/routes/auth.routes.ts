import { Router, Request, Response } from 'express';
import { getAuth, clerkClient } from '@clerk/express';
import { requireAuth } from '../middleware/auth.middleware';

export const authRouter = Router();

/**
 * GET /api/auth/me
 * Protected endpoint returning the authenticated user's profile.
 * Clerk verifies the session token on the backend — user IDs are never trusted from the frontend.
 */
authRouter.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const auth = getAuth(req);
    const userId = auth.userId!;

    // Fetch the full user profile from Clerk's backend API
    const user = await clerkClient.users.getUser(userId);

    const primaryEmail = user.emailAddresses.find(
      (e: { id: string; emailAddress: string }) => e.id === user.primaryEmailAddressId
    );

    return res.status(200).json({
      status: 'success',
      data: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || null,
        email: primaryEmail?.emailAddress || null,
        imageUrl: user.imageUrl,
        createdAt: user.createdAt,
        lastSignInAt: user.lastSignInAt,
      },
    });
  } catch (error: any) {
    console.error('[AuthRouter] Error fetching user profile:', error.message);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve user profile',
    });
  }
});
