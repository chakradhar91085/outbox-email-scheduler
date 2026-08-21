import { IEmailProvider } from './email-provider.interface';
import { EtherealEmailProvider } from './ethereal-email.provider';
import { ResendEmailProvider } from './resend-email.provider';
import { config } from '../../config';

export class EmailProviderFactory {
  public static createProvider(providerName: string = config.emailProvider): IEmailProvider {
    const normalized = (providerName || 'ethereal').trim().toLowerCase();

    switch (normalized) {
      case 'ethereal':
        console.log('[EmailProviderFactory] Selected Provider: ETHEREAL (SMTP)');
        return new EtherealEmailProvider();
      case 'resend':
        console.log('[EmailProviderFactory] Selected Provider: RESEND (HTTP API)');
        return new ResendEmailProvider();
      default:
        throw new Error(
          `Unsupported EMAIL_PROVIDER: "${providerName}". Supported providers are 'ethereal' (default for assessment) and 'resend'.`
        );
    }
  }
}
