export type EmailStatus = 'PENDING' | 'PROCESSING' | 'SENT' | 'FAILED';

export interface Email {
  id: string;
  campaignId: string;
  recipientEmail: string;
  scheduledAt: string;
  status: EmailStatus;
  sentAt: string | null;
  attempts: number;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  campaign?: {
    id: string;
    subject: string;
    sender: string;
    body: string;
  };
}

export interface Campaign {
  id: string;
  subject: string;
  body: string;
  sender: string;
  startTime: string;
  delaySeconds: number;
  hourlyLimit: number;
  totalEmails: number;
  pendingEmails: number;
  sentEmails: number;
  processingEmails: number;
  failedEmails: number;
  createdAt: string;
  updatedAt: string;
  emails?: Email[];
}

export interface QueueStatus {
  queueName: string;
  counts: {
    waiting: number;
    active: number;
    delayed: number;
    completed: number;
    failed: number;
    paused: number;
  };
  workerConcurrency: number;
  rateLimitWindowMs: number;
  rateLimitWindowDescription: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EmailsResponse {
  emails: Email[];
  pagination: Pagination;
}

export interface CreateCampaignPayload {
  recipients: string[];
  subject: string;
  body: string;
  sender: string;
  startTime: string;
  delaySeconds: number;
  hourlyLimit: number;
}

export interface UserProfile {
  id: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  email: string | null;
  imageUrl: string | null;
  createdAt: number;
  lastSignInAt: number;
}
