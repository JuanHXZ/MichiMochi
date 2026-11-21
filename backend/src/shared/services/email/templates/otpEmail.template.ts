export function buildOtpEmailTemplate(params: { code: string; expiresInMinutes: number }) {
  const { code, expiresInMinutes } = params;
  const spacedCode = code.split('').join(' ');

  const subject = 'Tu código de seguridad Michi Mochi';
  const text = `Tu código de verificación de Michi Mochi es: ${code}. Tiene una vigencia de ${expiresInMinutes} minutos. Si no solicitaste este código, ignora este correo.`;

  const html = `<!DOCTYPE html>
<html lang="es">
  <body style="font-family: Arial, sans-serif; background-color: #fff8f9; color: #2b1e22; padding: 24px;">
    <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #f4d6dc;">
      <h1 style="margin: 0 0 12px; font-size: 22px; color: #b84a62;">Michi Mochi</h1>
      <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.5;">
        Recibimos una solicitud para restablecer tu contraseña. Usa el siguiente código de seguridad de 5 dígitos:
      </p>
      <div style="background: #ffe8ec; border-radius: 12px; padding: 16px; text-align: center; margin: 20px 0;">
        <span style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #b84a62;">${spacedCode}</span>
      </div>
      <p style="margin: 0 0 12px; font-size: 14px; color: #5c4950;">
        Este código vence en <strong>${expiresInMinutes} minutos</strong>.
      </p>
      <p style="margin: 0; font-size: 12px; color: #8c7880;">
        Si no solicitaste este cambio, puedes ignorar este mensaje de forma segura.
      </p>
    </div>
  </body>
</html>`;

  return { subject, html, text };
}
