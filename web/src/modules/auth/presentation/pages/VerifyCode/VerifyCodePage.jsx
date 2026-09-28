import React, { useState, useRef, useEffect } from 'react';
import verifyHeroImg from '@/shared/assets/verify-hero.png';
import { MdArrowBack, MdSupportAgent, MdCheckCircle } from 'react-icons/md';
import { FaFlag } from 'react-icons/fa';
import { useAuth } from '../../../application/hooks/useAuth';
import './VerifyCodePage.css';

export default function VerifyCodePage() {
  // En Figma Node 1:666 hay exactamente 5 casillas de dígitos OTP (1:695 a 1:707)
  const [digits, setDigits] = useState(['', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [email, setEmail] = useState('');

  const { verifyOtp, requestOtp } = useAuth();
  const inputRefs = useRef([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    if (emailParam) {
      setEmail(emailParam);
    } else {
      const stored = sessionStorage.getItem('recovery_email') || '';
      setEmail(stored);
    }

    // Auto-focus en la primera casilla
    inputRefs.current[0]?.focus();
  }, []);

  // Temporizador para el botón de reenvío
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleDigitChange = (index, value) => {
    const cleanValue = value.replace(/\D/g, '');
    if (error) setError('');

    const newDigits = [...digits];
    newDigits[index] = cleanValue.slice(-1);
    setDigits(newDigits);

    // Auto-salto a la siguiente casilla
    if (cleanValue && index < 4) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 4) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '');
    if (!pasteData) return;

    const chars = pasteData.slice(0, 5).split('');
    const newDigits = ['', '', '', '', ''];
    chars.forEach((char, i) => {
      newDigits[i] = char;
    });
    setDigits(newDigits);
    if (error) setError('');

    const nextIndex = Math.min(chars.length, 4);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    const code = digits.join('');

    if (code.length < 5) {
      setError('Por favor ingresa los 5 dígitos del código de verificación.');
      return;
    }

    if (!email) {
      setError('No se encontró el correo de recuperación. Vuelve a iniciar el proceso.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const result = await verifyOtp(email, code);
      if (result.ok) {
        setIsVerified(true);
        sessionStorage.setItem('otp_verified', 'true');
        if (result.data?.resetToken) {
          sessionStorage.setItem('recovery_reset_token', result.data.resetToken);
        }

        // Transición al Paso 3 (New Password)
        setTimeout(() => {
          window.location.href = `/new-password?email=${encodeURIComponent(email)}`;
        }, 1200);
      } else {
        setError(result.message || 'Código de verificación incorrecto o expirado.');
      }
    } catch (err) {
      setError(err.message || 'Error al validar el código.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return;

    if (!email) {
      setError('No se especificó un correo para reenviar el código.');
      return;
    }

    setResending(true);
    setError('');

    try {
      const result = await requestOtp(email);
      if (result.ok) {
        if (result.data?.debugCode) {
          console.log(`%c[MichiMochi Dev] Nuevo código OTP reenviado a ${email}: ${result.data.debugCode}`, 'background: #FFE8EC; color: #E88D9D; font-size: 14px; font-weight: bold; padding: 4px 8px; border-radius: 4px;');
        }
        setResendCooldown(60);
        setDigits(['', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        setError(result.message || 'No fue posible reenviar el código.');
      }
    } catch (err) {
      setError(err.message || 'Error al solicitar nuevo código.');
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="verify-split-screen" data-node-id="1:666">
      {/* Lado Izquierdo: Brand Imagery (Node 1:668) */}
      <section className="verify-hero-section" data-node-id="1:668">
        <img
          src={verifyHeroImg}
          alt="Michi Mochi Assortment"
          className="verify-hero-image"
          data-node-id="1:669"
        />

        {/* Tarjeta Glassmorphism flotante (Node 1:670) */}
        <div className="verify-glass-card" data-node-id="1:670">
          <div className="verify-glass-brand" data-node-id="1:672">
            <div className="verify-glass-logo-icon" data-node-id="1:673">
              <FaFlag className="verify-flag-icon" />
            </div>
            <span className="verify-glass-brand-text" data-node-id="1:676">
              Michi Mochi
            </span>
          </div>

          <h1 className="verify-glass-title" data-node-id="1:678">
            Dulzura en cada paso.
          </h1>

          <p className="verify-glass-subtitle" data-node-id="1:680">
            Tu seguridad es nuestra prioridad mientras preparamos tu próximo pedido especial.
          </p>
        </div>
      </section>

      {/* Lado Derecho: Verification Form (Node 1:681) */}
      <section className="verify-form-container" data-node-id="1:681">
        <div className="verify-form-inner" data-node-id="1:682">
          {/* Header Section con Enlace Superior (Node 1:683) */}
          <div className="verify-header-section" data-node-id="1:683">
            <div className="verify-top-link-wrapper" data-node-id="1:684">
              <a href="/login" className="verify-top-back-link" data-node-id="1:685">
                <MdArrowBack className="verify-top-back-icon" data-node-id="1:687" />
                <span data-node-id="1:689">Volver al inicio de sesión</span>
              </a>
            </div>

            <h2 className="verify-heading" data-node-id="1:691">
              Verificar código
            </h2>

            <p className="verify-instruction-text" data-node-id="1:693">
              Hemos enviado un código de seguridad a tu correo electrónico
              {email ? (
                <> (<strong>{email}</strong>)</>
              ) : null}
              . Por favor, ingrésalo a continuación para continuar.
            </p>
          </div>

          {isVerified ? (
            <div className="verify-feedback-success" role="alert">
              <div className="verify-feedback-icon-wrap">
                <MdCheckCircle className="verify-feedback-icon" />
              </div>
              <h3 className="verify-feedback-title">¡Código verificado!</h3>
              <p className="verify-feedback-text">
                Tu identidad ha sido confirmada. Redirigiendo a restablecer contraseña...
              </p>
              <div className="verify-feedback-spinner" />
            </div>
          ) : (
            <>
              {error && (
                <div className="verify-feedback-error" role="alert">
                  {error}
                </div>
              )}

              {/* Input Fields: 5 Casillas OTP (Node 1:694) */}
              <form onSubmit={handleVerify} className="verify-form-body">
                <div
                  className="verify-otp-inputs-row"
                  onPaste={handlePaste}
                  data-node-id="1:694"
                >
                  {digits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (inputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      placeholder="•"
                      className={`verify-digit-box ${digit ? 'is-filled' : ''} ${error ? 'has-error' : ''}`}
                      aria-label={`Dígito ${idx + 1}`}
                      disabled={loading}
                      autoComplete="one-time-code"
                      data-node-id={
                        idx === 0
                          ? '1:695'
                          : idx === 1
                          ? '1:698'
                          : idx === 2
                          ? '1:701'
                          : idx === 3
                          ? '1:704'
                          : '1:707'
                      }
                    />
                  ))}
                </div>

                {/* Action Button & Resend Section (Node 1:710) */}
                <div className="verify-action-section" data-node-id="1:710">
                  <button
                    type="submit"
                    className="verify-action-button"
                    disabled={loading || digits.join('').length < 5}
                    data-node-id="1:711"
                  >
                    <span>{loading ? 'Verificando...' : 'Verificar'}</span>
                  </button>

                  <div className="verify-resend-row" data-node-id="1:714">
                    <span className="verify-resend-text" data-node-id="1:715">
                      ¿No recibiste el código?{' '}
                    </span>
                    {resendCooldown > 0 ? (
                      <span className="verify-resend-timer">
                        Espera <strong>{resendCooldown}s</strong>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={resending}
                        className="verify-resend-button"
                        data-node-id="1:716"
                      >
                        <span data-node-id="1:717">
                          {resending ? 'Reenviando...' : 'Reenviar código'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Help Card (Node 1:718) */}
                <aside className="verify-help-card" data-node-id="1:719">
                  <div className="verify-help-icon-circle" data-node-id="1:720">
                    <MdSupportAgent className="verify-help-icon" data-node-id="1:721" />
                  </div>
                  <div className="verify-help-text-content" data-node-id="1:722">
                    <h4 className="verify-help-title" data-node-id="1:724">
                      ¿Necesitas ayuda?
                    </h4>
                    <p className="verify-help-description" data-node-id="1:726">
                      Si tienes problemas con el acceso, recuerda revisar tu carpeta de correo no
                      deseado o contacta a nuestro equipo de dulzura.
                    </p>
                  </div>
                </aside>
              </form>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
