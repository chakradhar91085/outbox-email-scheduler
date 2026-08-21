import nodemailer, { Transporter } from 'nodemailer';
import { IEmailProvider, SendEmailOptions, SendEmailResult } from './email-provider.interface';
import { config } from '../../config';

export class EtherealEmailProvider implements IEmailProvider {
  public readonly name = 'ethereal';
  private transporter: Transporter | null = null;
  private isInitialized = false;
  private defaultSender = config.smtp.from;

  /**
   * Initializes the Nodemailer transporter with connection pooling and burst throttling.
   * If SMTP_USER and SMTP_PASS are not provided, dynamically generates an Ethereal test account.
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized && this.transporter) {
      return;
    }

    let smtpUser = config.smtp.user;
    let smtpPass = config.smtp.pass;
    let smtpHost = config.smtp.host;
    let smtpPort = config.smtp.port;
    let smtpSecure = config.smtp.secure;

    if (!smtpUser || !smtpPass) {
      console.log('[EtherealProvider] No SMTP credentials provided. Creating test Ethereal account dynamically...');
      const testAccount = await nodemailer.createTestAccount();
      smtpUser = testAccount.user;
      smtpPass = testAccount.pass;
      smtpHost = testAccount.smtp.host;
      smtpPort = testAccount.smtp.port;
      smtpSecure = testAccount.smtp.secure;

      console.log('====================================================');
      console.log('📧 Ethereal Test Account Generated Automatically:');
      console.log(`   User: ${smtpUser}`);
      console.log(`   Host: ${smtpHost}:${smtpPort}`);
      console.log('====================================================');
    }

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      pool: true,
      maxConnections: 3,
      maxMessages: 100,
      rateDelta: 1000,
      rateLimit: 3,
    });

    try {
      await this.transporter.verify();
      console.log(`[EtherealProvider] SMTP Connection verified successfully (${smtpHost}:${smtpPort})`);
      this.isInitialized = true;
    } catch (err: any) {
      console.error('[EtherealProvider] SMTP Verification failed:', err.message);
      throw new Error(`Failed to connect to Ethereal SMTP server: ${err.message}`);
    }
  }

  /**
   * Dispatches email via Nodemailer through Ethereal SMTP.
   */
  public async sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    if (!this.transporter) {
      await this.initialize();
    }

    if (!this.transporter) {
      throw new Error('Ethereal email transporter is not initialized');
    }

    const fromAddress = options.from || this.defaultSender;

    const mailOptions = {
      from: fromAddress,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html || `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h3 style="color: #4f46e5; margin-top: 0;">${options.subject}</h3>
        <p style="white-space: pre-wrap; font-size: 15px;">${options.text}</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin-top: 24px; margin-bottom: 12px;" />
        <p style="font-size: 12px; color: #94a3b8; margin: 0;">Sent via ReachInbox Scheduler • Ethereal SMTP Provider</p>
      </div>`,
    };

    const info = await this.transporter.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info);

    return {
      messageId: info.messageId,
      provider: this.name,
      previewUrl: previewUrl || false,
      response: info.response,
      accepted: (info.accepted as string[]) || [],
      rejected: (info.rejected as string[]) || [],
    };
  }
}
