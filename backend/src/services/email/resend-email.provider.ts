import { IEmailProvider, SendEmailOptions, SendEmailResult } from './email-provider.interface';
import { config } from '../../config';

export class ResendEmailProvider implements IEmailProvider {
  public readonly name = 'resend';
  private apiKey: string = config.resendApiKey;
  private defaultSender = config.smtp.from;

  public async initialize(): Promise<void> {
    if (!this.apiKey) {
      throw new Error(
        "EMAIL_PROVIDER is set to 'resend' but RESEND_API_KEY is missing or empty. Please set RESEND_API_KEY in your environment variables or switch to EMAIL_PROVIDER=ethereal."
      );
    }
    console.log('[ResendProvider] Initialized with Resend HTTP API.');
  }

  public async sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    if (!this.apiKey) {
      throw new Error(
        "EMAIL_PROVIDER is set to 'resend' but RESEND_API_KEY is missing. Please set RESEND_API_KEY in your .env file or switch to EMAIL_PROVIDER=ethereal."
      );
    }

    const fromAddress = options.from || this.defaultSender;

    const payload = {
      from: fromAddress,
      to: [options.to],
      subject: options.subject,
      text: options.text,
      html: options.html || undefined,
    };

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as { id?: string; message?: string; name?: string };

    if (!response.ok || !data.id) {
      const errorMsg = data.message || `Resend API error (Status: ${response.status})`;
      throw new Error(`Failed to send email via Resend: ${errorMsg}`);
    }

    return {
      messageId: data.id,
      provider: this.name,
      previewUrl: false,
      response: `250 OK - Resend ID: ${data.id}`,
      accepted: [options.to],
      rejected: [],
    };
  }
}
