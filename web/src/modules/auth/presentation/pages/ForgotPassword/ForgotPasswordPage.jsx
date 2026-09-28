import React, { useState } from 'react';
import forgotHeroImg from '@/shared/assets/forgot-hero.png';
import { MdEmail, MdArrowBack } from 'react-icons/md';
import { HiArrowRight } from 'react-icons/hi2';
import { useAuth } from '../../../application/hooks/useAuth';
import { isValidEmail } from '../../../domain/authValidation';
import './ForgotPasswordPage.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const { resetPassword, loading, error: authError } = useAuth();

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Por favor introduce tu correo electrónico.');
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setError('Por favor introduce un correo electrónico válido.');
      return;
    }

    setError('');
    const result = await resetPassword(trimmedEmail);

    if (result.ok) {
      if (result.data?.debugCode) {
        console.log(`%c[MichiMochi Dev] Código OTP enviado a ${trimmedEmail}: ${result.data.debugCode}`, 'background: #FFE8EC; color: #E88D9D; font-size: 14px; font-weight: bold; padding: 4px 8px; border-radius: 4px;');
      }
      setIsSuccess(true);
      sessionStorage.setItem('recovery_email', trimmedEmail);

      // Redirigir al Paso 2 (Verify Code) tras confirmar el envío
      setTimeout(() => {
        window.location.href = `/verify-code?email=${encodeURIComponent(trimmedEmail)}`;
      }, 1200);
    } else {
      setError(result.message || 'Error al enviar el código de recuperación.');
    }
  };

  return (
    <main className="forgot-split-screen" data-node-id="1:727">
      {/* Lado Izquierdo: Hero Image Section (Node 1:729) */}
      <section className="forgot-hero-section" data-node-id="1:729">
        <img
          src={forgotHeroImg}
          alt="Artisanal Mochi"
          className="forgot-hero-image"
          data-node-id="1:730"
        />
        <div className="forgot-hero-overlay" data-node-id="1:731" />

        <div className="forgot-hero-content" data-node-id="1:732">
          <h2 className="forgot-hero-title" data-node-id="1:734">
            Dulzura en cada bocado.
          </h2>
          <p className="forgot-hero-subtitle" data-node-id="1:736">
            Pronto volverás a disfrutar de tus sabores favoritos.
          </p>
        </div>
      </section>

      {/* Lado Derecho: Minimalist Form Section (Node 1:737) */}
      <section className="forgot-form-container" data-node-id="1:737">
        <div className="forgot-form-inner" data-node-id="1:738">
          {/* Brand Identity (Node 1:740) */}
          <div className="forgot-brand-identity" data-node-id="1:740">
            <span className="forgot-brand-title" data-node-id="1:742">
              Michi Mochi
            </span>
            <div className="forgot-brand-accent-line" data-node-id="1:743" />
          </div>

          {/* Instructional Content (Node 1:745) */}
          <div className="forgot-instructional-content" data-node-id="1:745">
            <h1 className="forgot-heading" data-node-id="1:747">
              Recuperar contraseña
            </h1>
            <p className="forgot-description" data-node-id="1:749">
              Introduce tu correo electrónico y te enviaremos las instrucciones para restablecer tu contraseña.
            </p>
          </div>

          {/* Alertas de error o éxito */}
          {(error || authError) && (
            <div className="forgot-alert-error" role="alert">
              {error || authError}
            </div>
          )}

          {isSuccess ? (
            <div className="forgot-alert-success" role="alert">
              <p className="forgot-alert-success-title">¡Código enviado con éxito!</p>
              <p className="forgot-alert-success-text">
                Redirigiendo a la pantalla de verificación para <strong>{email.trim()}</strong>...
              </p>
              <div className="forgot-spinner" />
            </div>
          ) : (
            /* Formulario (Node 1:750) */
            <form onSubmit={handleSubmit} className="forgot-form" data-node-id="1:750">
              <div className="forgot-input-group" data-node-id="1:751">
                <label htmlFor="forgot-email" className="forgot-label" data-node-id="1:752">
                  Correo electrónico
                </label>
                <div className="forgot-input-wrapper" data-node-id="1:753">
                  <MdEmail className="forgot-input-icon" data-node-id="1:758" />
                  <input
                    id="forgot-email"
                    type="email"
                    className={`forgot-input ${error ? 'is-invalid' : ''}`}
                    placeholder="ejemplo@michi.com"
                    value={email}
                    onChange={handleEmailChange}
                    autoComplete="email"
                    disabled={loading}
                    data-node-id="1:754"
                  />
                </div>
              </div>

              {/* Botón Enviar Código (Node 1:759) */}
              <button
                type="submit"
                className="forgot-submit-button"
                disabled={loading}
                data-node-id="1:759"
              >
                <span>{loading ? 'Enviando código...' : 'Enviar código'}</span>
                <HiArrowRight className="forgot-button-icon" data-node-id="1:764" />
              </button>

              {/* Footer Link (Node 1:766) */}
              <div className="forgot-footer-link-wrapper" data-node-id="1:765">
                <a href="/login" className="forgot-back-link" data-node-id="1:766">
                  <MdArrowBack className="forgot-back-icon" data-node-id="1:768" />
                  <span data-node-id="1:769">Volver al inicio de sesión</span>
                </a>
              </div>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
