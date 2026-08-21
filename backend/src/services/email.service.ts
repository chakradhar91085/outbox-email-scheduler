import { IEmailProvider, SendEmailOptions, SendEmailResult } from './email/email-provider.interface';
import { EmailProviderFactory } from './email/email-provider.factory';

export * from './email/email-provider.interface';

export class EmailService {
  private static instance: EmailService;
  private provider: IEmailProvider;

  private constructor() {
    this.provider = EmailProviderFactory.createProvider();
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  /**
   * Initializes the configured email provider.
   */
  public async initialize(): Promise<void> {
    await this.provider.initialize();
  }

  /**
   * Sends an email via the active provider (defaults to Ethereal SMTP).
   */
  public async sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    return this.provider.sendEmail(options);
  }

  /**
   * Returns the identifier of the active provider (e.g. 'ethereal' or 'resend').
   */
  public getProviderName(): string {
    return this.provider.name;
  }
}

export const emailService = EmailService.getInstance();
