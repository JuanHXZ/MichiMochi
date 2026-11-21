import { ENV } from '../config/env.js';
import { ConsoleEmailProvider } from './email/ConsoleEmailProvider.js';
import { IEmailProvider } from './email/IEmailProvider.js';
import { ResendEmailProvider } from './email/ResendEmailProvider.js';
import { buildOtpEmailTemplate } from './email/templates/otpEmail.template.js';

export interface SendOtpEmailParams {
  to: string;
  code: string;
  expiresInMinutes?: number;
}

export function createEmailProvider(providerName: 'resend' | 'console' = ENV.EMAIL_PROVIDER): IEmailProvider {
  if (ENV.NODE_ENV === 'production' && providerName !== 'resend') {
    throw new Error('En producción solo se permite EMAIL_PROVIDER="resend".');
  }

  if (providerName === 'resend') {
    return new ResendEmailProvider();
  }

  return new ConsoleEmailProvider();
}

export class EmailService {
  static async sendOtpEmail({
    to,
    code,
    expiresInMinutes = 15,
  }: SendOtpEmailParams): Promise<{ sent: boolean; mock: boolean; provider: string; messageId?: string; code?: string }> {
    const isProd = ENV.NODE_ENV === 'production';
    const provider = createEmailProvider(ENV.EMAIL_PROVIDER);
    const template = buildOtpEmailTemplate({ code, expiresInMinutes });

    const result = await provider.send({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    return {
      sent: true,
      mock: result.provider === 'console',
      provider: result.provider,
      messageId: result.messageId,
      ...(!isProd && result.provider === 'console' ? { code } : {}),
    };
  }
}
