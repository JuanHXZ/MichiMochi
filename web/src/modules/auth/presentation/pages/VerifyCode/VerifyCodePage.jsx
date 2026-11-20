import React, { useState, useRef, useEffect } from 'react';
import verifyHeroImg from '@/shared/assets/verify-hero.png';
import { MdArrowBack, MdSupportAgent, MdCheckCircle } from 'react-icons/md';
import { FaFlag } from 'react-icons/fa';
import { useAuth } from '../../../application/hooks/useAuth';
import './VerifyCodePage.css';

export default function VerifyCodePage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [email, setEmail] = useState('');

  const { verifyOtp, requestOtp } = useAuth();
  const otpInputRef = useRef(null);
  const formRef = useRef(null);
  const otpAbortRef = useRef(null);

  const stopSmsOtpListener = () => {
    if (otpAbortRef.current) {
      otpAbortRef.current.abort();
      otpAbortRef.current = null;
    }
  };

  const startSmsOtpListener = async () => {
    if (!('OTPCredential' in window)) return;
    stopSmsOtpListener();
    const ac = new AbortController();
    otpAbortRef.current = ac;
    try {
      const otp = await navigator.credentials.get({
        otp: { transport: ['sms'] },
        signal: ac.signal,
      });
      if (!otp?.code) return;
      setCode(String(otp.code).replace(/\D/g, '').slice(0, 5));
      formRef.current?.requestSubmit();
    } catch (err) {
      if (err?.name === 'AbortError') return;
    }
  };

  useEffect(() => {
    const stored = sessionStorage.getItem('recovery_email') || '';
    setEmail(stored);
    otpInputRef.current?.focus();
    startSmsOtpListener();
    return () => stopSmsOtpListener();
  }, []);

  // Temporizador para el botón de reenvío
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleCodeChange = (e) => {
    const cleanValue = e.target.value.replace(/\D/g, '').slice(0, 5);
    if (error) setError('');
    setCode(cleanValue);
  };

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    stopSmsOtpListener();

    if (code.length < 5) {
      setError('Por favor ingresa los 5 dígitos del código de verificación.');
      otpInputRef.current?.focus();
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
          window.location.href = '/new-password';
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
        if (import.meta.env.DEV && result.data?.debugCode) {
          console.log(`%c[MichiMochi Dev] Nuevo código OTP reenviado a ${email}: ${result.data.debugCode}`, 'background: #FFE8EC; color: #E88D9D; font-size: 14px; font-weight: bold; padding: 4px 8px; border-radius: 4px;');
        }
        setResendCooldown(60);
        setCode('');
        otpInputRef.current?.focus();
        startSmsOtpListener();
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
    <main id="main-content" className="verify-split-screen" data-node-id="1:666">
      {/* Lado Izquierdo: Brand Imagery (Node 1:668) */}
      <section className="verify-hero-section" data-node-id="1:668">
        <img
          src={verifyHeroImg}
          alt="Michi Mochi Assortment"
          className="verify-hero-image"
          width={640}
          height={792}
          fetchPriority="high"
          data-node-id="1:669"
        />

        {/* Tarjeta Glassmorphism flotante (Node 1:670) */}
        <div className="verify-glass-card" data-node-id="1:670">
          <div className="verify-glass-brand" data-node-id="1:672">
            <div className="verify-glass-logo-icon" aria-hidden="true" data-node-id="1:673">
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
                <MdArrowBack className="verify-top-back-icon" aria-hidden="true" data-node-id="1:687" />
                <span data-node-id="1:689">Volver al inicio de sesión</span>
              </a>
            </div>

            <h2 className="verify-heading" data-node-id="1:691">
              Verificar código
            </h2>

            <p id="otp-hint" className="verify-instruction-text" data-node-id="1:693">
              Hemos enviado un código de seguridad de 5 dígitos a tu correo electrónico
              {email ? (
                <> (<strong>{email}</strong>)</>
              ) : null}
              . Por favor, ingrésalo a continuación para continuar.
            </p>
          </div>

          {isVerified ? (
            <div className="verify-feedback-success" role="alert">
              <div className="verify-feedback-icon-wrap" aria-hidden="true">
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
                <div id="otp-error" className="verify-feedback-error" role="alert">
                  {error}
                </div>
              )}

              {/* Input Field: Single numeric OTP (Node 1:694) */}
              <form ref={formRef} onSubmit={handleVerify} className="verify-form-body">
                <div className="verify-otp-inputs-row" data-node-id="1:694">
                  <label htmlFor="otp-code" className="visually-hidden">
                    Código de verificación de 5 dígitos
                  </label>
                  <input
                    ref={otpInputRef}
                    id="otp-code"
                    name="otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="\d{5}"
                    maxLength={5}
                    required
                    enterKeyHint="done"
                    spellCheck={false}
                    value={code}
                    onChange={handleCodeChange}
                    placeholder="•••••"
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? 'otp-hint otp-error' : 'otp-hint'}
                    className={`verify-otp-input ${code ? 'is-filled' : ''} ${error ? 'has-error' : ''}`}
                    disabled={loading}
                    data-node-id="1:695"
                  />
                </div>

                {/* Action Button & Resend Section (Node 1:710) */}
                <div className="verify-action-section" data-node-id="1:710">
                  <button
                    type="submit"
                    className="verify-action-button"
                    disabled={loading}
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
                  <div className="verify-help-icon-circle" aria-hidden="true" data-node-id="1:720">
                    <MdSupportAgent className="verify-help-icon" data-node-id="1:721" />
                  </div>
                  <div className="verify-help-text-content" data-node-id="1:722">
                    <h3 className="verify-help-title" data-node-id="1:724">
                      ¿Necesitas ayuda?
                    </h3>
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
