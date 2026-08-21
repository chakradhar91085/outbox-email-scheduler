export interface SendEmailOptions {
  from?: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface SendEmailResult {
  messageId: string;
  provider: string;
  previewUrl: string | false;
  response?: string;
  accepted?: string[];
  rejected?: string[];
}

export interface IEmailProvider {
  readonly name: string;
  initialize(): Promise<void>;
  sendEmail(options: SendEmailOptions): Promise<SendEmailResult>;
}
