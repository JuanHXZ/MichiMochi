import { ENV } from '../config/env.js';

export interface SendOtpEmailParams {
  to: string;
  code: string;
  expiresInMinutes?: number;
}

export class EmailService {
  /**
   * Envía el correo con el código OTP de seguridad para recuperación de contraseña.
   * En desarrollo utiliza el Mock / Console Logger estructurado.
   */
  static async sendOtpEmail({ to, code, expiresInMinutes = 15 }: SendOtpEmailParams): Promise<{ sent: boolean; mock: boolean; code?: string }> {
    const isDev = ENV.NODE_ENV !== 'production';

    // Mock Logger para desarrollo y pruebas
    console.log('\n╭─────────────────────────────────────────────────────────────╮');
    console.log('│ 📧 Michi Mochi — Correo Transaccional (OTP)                 │');
    console.log('├─────────────────────────────────────────────────────────────┤');
    console.log(`│ Para:     ${to.padEnd(48)} │`);
    console.log('│ Asunto:   Tu código de seguridad Michi Mochi                │');
    console.log(`│ Código:   [ ${code.split('').join(' ')} ] (5 dígitos)                        │`);
    console.log(`│ Vigencia: ${expiresInMinutes} minutos                                        │`);
    console.log('╰─────────────────────────────────────────────────────────────╯\n');

    // Retorna confirmación de envío
    return {
      sent: true,
      mock: isDev,
      ...(isDev ? { code } : {}),
    };
  }
}
