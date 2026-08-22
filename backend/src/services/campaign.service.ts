import { prisma } from '../lib/prisma';
import { EmailStatus } from '@prisma/client';
import { addEmailJobsBulk } from '../queues/email.queue';

export interface CreateCampaignInput {
  recipients: string[];
  subject: string;
  body: string;
  sender: string;
  startTime: Date;
  delaySeconds: number;
  hourlyLimit: number;
}

export class CampaignService {
  /**
   * Creates a Campaign and all individual Email records in PostgreSQL within a transaction,
   * then enqueues BullMQ delayed jobs using high-performance atomic bulk enqueuing.
   */
  public static async createCampaign(input: CreateCampaignInput) {
    const { recipients, subject, body, sender, startTime, delaySeconds, hourlyLimit } = input;

    const nowMs = Date.now();
    const requestedStartMs = startTime.getTime();
    // If requested start time is in the past (e.g. immediate start or form delay), anchor to now so stagger delays are preserved
    const effectiveStartMs = Math.max(nowMs, requestedStartMs);
    const delayMs = Math.max(0, delaySeconds) * 1000;

    // 1. Persist Campaign and all Email records inside PostgreSQL transaction
    const createdCampaign = await prisma.$transaction(async (tx) => {
      // Step A: Create Campaign record
      const campaign = await tx.campaign.create({
        data: {
          subject,
          body,
          sender,
          startTime: new Date(effectiveStartMs),
          delaySeconds,
          hourlyLimit,
        },
      });

      // Step B: Prepare Email records with calculated staggered scheduledAt
      const emailsData = recipients.map((recipientEmail, index) => {
        const scheduledTimeMs = effectiveStartMs + index * delayMs;
        return {
          campaignId: campaign.id,
          recipientEmail: recipientEmail.trim(),
          scheduledAt: new Date(scheduledTimeMs),
          status: EmailStatus.PENDING,
          attempts: 0,
        };
      });

      // Step C: Batch insert Email records
      await tx.email.createMany({
        data: emailsData,
      });

      // Step D: Retrieve campaign with created emails ordered by scheduledAt
      return await tx.campaign.findUniqueOrThrow({
        where: { id: campaign.id },
        include: {
          emails: {
            orderBy: { scheduledAt: 'asc' },
          },
        },
      });
    });

    // 2. High-performance atomic bulk enqueuing in BullMQ (handles 1000+ jobs in a single Redis pipeline)
    const jobsToEnqueue = createdCampaign.emails.map((e) => ({
      emailId: e.id,
      scheduledAt: e.scheduledAt,
    }));

    try {
      await addEmailJobsBulk(jobsToEnqueue);
    } catch (err: any) {
      console.error(`[QueueError] Failed to bulk enqueue BullMQ jobs:`, err.message);
    }

    console.log(
      `[CampaignService] Campaign '${createdCampaign.id}' created in PostgreSQL with ${createdCampaign.emails.length} emails. Enqueued delayed BullMQ jobs via addEmailJobsBulk.`
    );

    return {
      ...createdCampaign,
      queuedJobsCount: createdCampaign.emails.length,
    };
  }

  /**
   * Retrieves all campaigns with summary counters (total emails, pending, sent, processing, failed).
   */
  public static async getAllCampaigns() {
    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        emails: {
          select: {
            status: true,
          },
        },
      },
    });

    return campaigns.map((campaign) => {
      const totalEmails = campaign.emails.length;
      const pendingEmails = campaign.emails.filter((e) => e.status === EmailStatus.PENDING).length;
      const sentEmails = campaign.emails.filter((e) => e.status === EmailStatus.SENT).length;
      const processingEmails = campaign.emails.filter((e) => e.status === EmailStatus.PROCESSING).length;
      const failedEmails = campaign.emails.filter((e) => e.status === EmailStatus.FAILED).length;

      return {
        id: campaign.id,
        subject: campaign.subject,
        body: campaign.body,
        sender: campaign.sender,
        startTime: campaign.startTime,
        delaySeconds: campaign.delaySeconds,
        hourlyLimit: campaign.hourlyLimit,
        totalEmails,
        pendingEmails,
        sentEmails,
        processingEmails,
        failedEmails,
        createdAt: campaign.createdAt,
        updatedAt: campaign.updatedAt,
      };
    });
  }

  /**
   * Retrieves a single campaign with all associated emails ordered by scheduledAt ascending.
   */
  public static async getCampaignById(id: string) {
    return prisma.campaign.findUnique({
      where: { id },
      include: {
        emails: {
          orderBy: { scheduledAt: 'asc' },
        },
      },
    });
  }
}
