import React, { useState, useEffect } from 'react';
import newPasswordHeroImg from '@/shared/assets/new-password-hero.png';
import {
  MdLock,
  MdShield,
  MdVisibility,
  MdVisibilityOff,
  MdCheckCircle,
  MdRadioButtonUnchecked,
  MdArrowBack,
} from 'react-icons/md';
import { useAuth } from '../../../application/hooks/useAuth';
import './NewPasswordPage.css';

export default function NewPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');

  const { resetPasswordWithToken } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    const tokenParam = params.get('token');

    if (emailParam) {
      setEmail(emailParam);
    } else {
      const stored = sessionStorage.getItem('recovery_email') || '';
      setEmail(stored);
    }

    if (tokenParam) {
      setResetToken(tokenParam);
    } else {
      const storedToken = sessionStorage.getItem('recovery_reset_token') || '';
      setResetToken(storedToken);
    }
  }, []);

  // Validación de requisitos de seguridad en tiempo real
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isPasswordValid = hasMinLength && hasUppercase && hasNumber && hasSymbol;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isPasswordValid) {
      setError('Por favor cumple con todos los requisitos de seguridad.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (!email) {
      setError('No se encontró el correo del usuario. Por favor reinicia el proceso.');
      return;
    }

    if (!resetToken) {
      setError('Token de verificación no encontrado o expirado. Por favor ingresa el código nuevamente.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const result = await resetPasswordWithToken(email, resetToken, password);
      if (result.ok) {
        setIsSuccess(true);
        sessionStorage.removeItem('recovery_email');
        sessionStorage.removeItem('recovery_reset_token');
        sessionStorage.removeItem('otp_verified');

        setTimeout(() => {
          window.location.href = '/login?reset=success';
        }, 1500);
      } else {
        setError(result.message || 'Error al restablecer la contraseña.');
      }
    } catch (err) {
      setError(err.message || 'Error al actualizar la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="new-pass-split-screen" data-node-id="1:797">
      {/* Lado Izquierdo: Brand Imagery (Node 1:799) */}
      <section className="new-pass-hero-section" data-node-id="1:799">
        <img
          src={newPasswordHeroImg}
          alt="Artisanal Mochi Arrangement"
          className="new-pass-hero-image"
          data-node-id="1:800"
        />
        <div className="new-pass-hero-overlay" data-node-id="1:801" />

        <div className="new-pass-hero-content" data-node-id="1:802">
          <h2 className="new-pass-hero-brand" data-node-id="1:804">
            Michi Mochi
          </h2>
          <p className="new-pass-hero-subtitle" data-node-id="1:806">
            Sabores que reconfortan el alma, seguridad que protege tus antojos.
          </p>
        </div>
      </section>

      {/* Lado Derecho: Password Recovery Form (Node 1:807) */}
      <section className="new-pass-form-container" data-node-id="1:807">
        <div className="new-pass-form-inner" data-node-id="1:808">
          {/* Header con Indicador de Paso (Node 1:809) */}
          <div className="new-pass-header" data-node-id="1:809">
            <div className="new-pass-step-badge" data-node-id="1:810">
              <MdShield className="new-pass-badge-icon" data-node-id="1:812" />
              <span data-node-id="1:814">PASO 3 DE 3</span>
            </div>

            <h1 className="new-pass-heading" data-node-id="1:816">
              Nueva contraseña
            </h1>

            <p className="new-pass-description" data-node-id="1:818">
              Crea una contraseña segura que sea fácil de recordar pero difícil de adivinar para
              proteger tu cuenta de antojos.
            </p>
          </div>

          {isSuccess ? (
            <div className="new-pass-success-alert" role="alert">
              <div className="new-pass-success-icon-wrap">
                <MdCheckCircle className="new-pass-success-icon" />
              </div>
              <h3 className="new-pass-success-title">¡Contraseña restablecida!</h3>
              <p className="new-pass-success-text">
                Tu clave ha sido actualizada exitosamente. Redirigiéndote al inicio de sesión...
              </p>
              <div className="new-pass-success-spinner" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="new-pass-form" data-node-id="1:819">
              {error && (
                <div className="new-pass-error-alert" role="alert">
                  {error}
                </div>
              )}

              <div className="new-pass-fields-container" data-node-id="1:820">
                {/* Campo 1: Nueva Contraseña (Node 1:821) */}
                <div className="new-pass-field" data-node-id="1:821">
                  <label htmlFor="new-password-input" className="new-pass-label" data-node-id="1:823">
                    Nueva contraseña
                  </label>
                  <div className="new-pass-input-wrapper" data-node-id="1:824">
                    <MdLock className="new-pass-input-icon-left" data-node-id="1:829" />
                    <input
                      id="new-password-input"
                      type={showPassword ? 'text' : 'password'}
                      className="new-pass-input"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError('');
                      }}
                      autoComplete="new-password"
                      disabled={loading}
                      data-node-id="1:825"
                    />
                    <button
                      type="button"
                      className="new-pass-visibility-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                      data-node-id="1:830"
                    >
                      {showPassword ? (
                        <MdVisibilityOff data-node-id="1:832" />
                      ) : (
                        <MdVisibility data-node-id="1:832" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Campo 2: Confirmar Contraseña (Node 1:833) */}
                <div className="new-pass-field" data-node-id="1:833">
                  <label
                    htmlFor="confirm-password-input"
                    className="new-pass-label"
                    data-node-id="1:835"
                  >
                    Confirmar contraseña
                  </label>
                  <div className="new-pass-input-wrapper" data-node-id="1:836">
                    <MdShield className="new-pass-input-icon-left" data-node-id="1:841" />
                    <input
                      id="confirm-password-input"
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="new-pass-input"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (error) setError('');
                      }}
                      autoComplete="new-password"
                      disabled={loading}
                      data-node-id="1:837"
                    />
                    <button
                      type="button"
                      className="new-pass-visibility-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      tabIndex={-1}
                      aria-label={
                        showConfirmPassword ? 'Ocultar contraseña' : 'Ver contraseña'
                      }
                      data-node-id="1:842"
                    >
                      {showConfirmPassword ? (
                        <MdVisibilityOff data-node-id="1:844" />
                      ) : (
                        <MdVisibility data-node-id="1:844" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Checklist de Requisitos de Seguridad (Node 1:845) */}
                <div className="new-pass-checklist-card" data-node-id="1:845">
                  <span className="new-pass-checklist-title" data-node-id="1:847">
                    REQUISITOS DE SEGURIDAD
                  </span>
                  <div className="new-pass-checklist-grid" data-node-id="1:848">
                    {/* Requisito 1: 8+ caracteres */}
                    <div
                      className={`new-pass-rule ${hasMinLength ? 'is-valid' : ''}`}
                      data-node-id="1:849"
                    >
                      {hasMinLength ? (
                        <MdCheckCircle className="new-pass-rule-icon valid" data-node-id="1:851" />
                      ) : (
                        <MdRadioButtonUnchecked className="new-pass-rule-icon" data-node-id="1:851" />
                      )}
                      <span data-node-id="1:853">8+ caracteres</span>
                    </div>

                    {/* Requisito 2: Una mayúscula */}
                    <div
                      className={`new-pass-rule ${hasUppercase ? 'is-valid' : ''}`}
                      data-node-id="1:854"
                    >
                      {hasUppercase ? (
                        <MdCheckCircle className="new-pass-rule-icon valid" data-node-id="1:856" />
                      ) : (
                        <MdRadioButtonUnchecked className="new-pass-rule-icon" data-node-id="1:856" />
                      )}
                      <span data-node-id="1:858">Una mayúscula</span>
                    </div>

                    {/* Requisito 3: Un número */}
                    <div
                      className={`new-pass-rule ${hasNumber ? 'is-valid' : ''}`}
                      data-node-id="1:859"
                    >
                      {hasNumber ? (
                        <MdCheckCircle className="new-pass-rule-icon valid" data-node-id="1:861" />
                      ) : (
                        <MdRadioButtonUnchecked className="new-pass-rule-icon" data-node-id="1:861" />
                      )}
                      <span data-node-id="1:863">Un número</span>
                    </div>

                    {/* Requisito 4: Símbolo ($#%) */}
                    <div
                      className={`new-pass-rule ${hasSymbol ? 'is-valid' : ''}`}
                      data-node-id="1:864"
                    >
                      {hasSymbol ? (
                        <MdCheckCircle className="new-pass-rule-icon valid" data-node-id="1:866" />
                      ) : (
                        <MdRadioButtonUnchecked className="new-pass-rule-icon" data-node-id="1:866" />
                      )}
                      <span data-node-id="1:868">Símbolo ($#%)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botón de Acción y Enlace de Retorno (Node 1:869) */}
              <div className="new-pass-cta-actions" data-node-id="1:869">
                <button
                  type="submit"
                  className="new-pass-submit-btn"
                  disabled={loading || !isPasswordValid || password !== confirmPassword}
                  data-node-id="1:870"
                >
                  <span data-node-id="1:872">
                    {loading ? 'Restableciendo...' : 'Restablecer contraseña'}
                  </span>
                </button>

                <div className="new-pass-back-wrapper">
                  <a href="/login" className="new-pass-back-link" data-node-id="1:873">
                    <MdArrowBack className="new-pass-back-icon" data-node-id="1:875" />
                    <span data-node-id="1:876">Volver al inicio de sesión</span>
                  </a>
                </div>
              </div>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
