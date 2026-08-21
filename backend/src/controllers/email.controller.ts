import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { EmailStatus, Prisma } from '@prisma/client';

export class EmailController {
  /**
   * GET /api/emails
   * Retrieves emails with optional filtering (status, campaignId, sender, search) and pagination.
   */
  public static async getEmails(req: Request, res: Response) {
    try {
      const { status, campaignId, sender, search } = req.query;
      const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
      const limit = Math.min(200, Math.max(1, parseInt((req.query.limit as string) || '50', 10)));
      const skip = (page - 1) * limit;

      const where: Prisma.EmailWhereInput = {};

      if (status && typeof status === 'string' && status.toUpperCase() !== 'ALL') {
        const upperStatus = status.toUpperCase() as EmailStatus;
        if (Object.values(EmailStatus).includes(upperStatus)) {
          where.status = upperStatus;
        }
      }

      if (campaignId && typeof campaignId === 'string') {
        where.campaignId = campaignId;
      }

      if (sender && typeof sender === 'string') {
        where.campaign = {
          sender: {
            contains: sender,
            mode: 'insensitive',
          },
        };
      }

      if (search && typeof search === 'string') {
        where.OR = [
          { recipientEmail: { contains: search, mode: 'insensitive' } },
          { campaign: { subject: { contains: search, mode: 'insensitive' } } },
          { campaign: { sender: { contains: search, mode: 'insensitive' } } },
        ];
      }

      const [total, emails] = await Promise.all([
        prisma.email.count({ where }),
        prisma.email.findMany({
          where,
          skip,
          take: limit,
          orderBy: { scheduledAt: 'desc' },
          include: {
            campaign: {
              select: {
                id: true,
                subject: true,
                sender: true,
                body: true,
              },
            },
          },
        }),
      ]);

      return res.status(200).json({
        status: 'success',
        data: {
          emails,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
          },
        },
      });
    } catch (error: any) {
      console.error('[EmailController] Error fetching emails:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve emails',
        error: error.message,
      });
    }
  }
}
