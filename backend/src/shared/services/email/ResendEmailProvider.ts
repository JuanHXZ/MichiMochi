import { ENV } from '../../config/env.js';
import { EmailMessage, EmailSendResult, IEmailProvider } from './IEmailProvider.js';

export class ResendEmailProvider implements IEmailProvider {
  constructor(
    private readonly apiKey: string = ENV.RESEND_API_KEY,
    private readonly from: string = ENV.EMAIL_FROM
  ) {}

  async send(message: EmailMessage): Promise<EmailSendResult> {
    if (!this.apiKey || !this.from) {
      throw new Error('RESEND_API_KEY y EMAIL_FROM son requeridos para enviar correos con Resend.');
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        from: this.from,
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
      signal: AbortSignal.timeout(10_000),
    });

    const data: any = await response.json().catch(() => null);
    if (!response.ok) {
      const reason = data?.message || data?.error || `HTTP ${response.status}`;
      throw new Error(`Error enviando correo vía Resend: ${reason}`);
    }

    return {
      messageId: data?.id,
      provider: 'resend',
    };
  }
}
