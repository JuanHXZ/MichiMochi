import { ENV } from '../../config/env.js';
import { EmailMessage, EmailSendResult, IEmailProvider } from './IEmailProvider.js';

export class ConsoleEmailProvider implements IEmailProvider {
  async send(message: EmailMessage): Promise<EmailSendResult> {
    if (ENV.NODE_ENV === 'production') {
      throw new Error('ConsoleEmailProvider no está permitido en producción.');
    }

    console.log('\n╭─────────────────────────────────────────────────────────────╮');
    console.log('│ 📧 Michi Mochi — Correo Transaccional (DEV/TEST)            │');
    console.log('├─────────────────────────────────────────────────────────────┤');
    console.log(`│ Para:    ${message.to}`);
    console.log(`│ Asunto:  ${message.subject}`);
    console.log(`│ Texto:   ${message.text}`);
    console.log('╰─────────────────────────────────────────────────────────────╯\n');

    return {
      messageId: `dev-${Date.now()}`,
      provider: 'console',
    };
  }
}
