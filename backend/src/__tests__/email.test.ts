import { jest } from '@jest/globals';
import { ENV } from '../shared/config/env.js';
import { EmailService, createEmailProvider } from '../shared/services/email.service.js';
import { ResendEmailProvider } from '../shared/services/email/ResendEmailProvider.js';
import { AuthService } from '../modules/auth/application/services/auth.service.js';
import { MemoryOtpRepository } from '../modules/auth/infrastructure/repositories/MemoryOtpRepository.js';
import { setOtpRepository } from '../modules/auth/infrastructure/repositories/otpRepository.factory.js';

describe('Transactional OTP Email Service (P0.4)', () => {
  const originalFetch = global.fetch;
  const originalNodeEnv = ENV.NODE_ENV;
  const originalProvider = ENV.EMAIL_PROVIDER;

  afterEach(() => {
    global.fetch = originalFetch;
    (ENV as any).NODE_ENV = originalNodeEnv;
    (ENV as any).EMAIL_PROVIDER = originalProvider;
    jest.restoreAllMocks();
  });

  it('should block ConsoleEmailProvider when NODE_ENV is production', () => {
    (ENV as any).NODE_ENV = 'production';
    expect(() => createEmailProvider('console')).toThrow(/producción/i);
  });

  it('should send OTP email via Resend HTTPS API when configured', async () => {
    const fetchMock = jest.fn(async () => ({
      ok: true,
      json: async () => ({ id: 'email_123' }),
    })) as any;
    global.fetch = fetchMock;

    const provider = new ResendEmailProvider('re_test_key', 'MichiMochi <no-reply@michimochi.com>');
    const res = await provider.send({
      to: 'cliente@michimochi.com',
      subject: 'Código',
      html: '<p>12345</p>',
      text: '12345',
    });

    expect(res).toEqual({ messageId: 'email_123', provider: 'resend' });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({
        method: 'POST',
      })
    );
  });

  it('should rollback stored OTP when EmailService fails to send', async () => {
    const otpRepo = new MemoryOtpRepository();
    setOtpRepository(otpRepo);

    jest.spyOn(EmailService, 'sendOtpEmail').mockRejectedValueOnce(new Error('Resend API down'));

    await expect(AuthService.forgotPassword('rollback@michimochi.com')).rejects.toThrow(
      /No fue posible enviar el correo/i
    );

    const stored = await otpRepo.findByEmail('rollback@michimochi.com');
    expect(stored).toBeNull();
  });
});
