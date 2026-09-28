import React, { useState } from 'react';
import MichiMochiIMG from '@/shared/assets/MichiMochiIMG.png';
import NavbarLogo from '@/shared/assets/navbar-logo.png';
import { MdEmail, MdArrowBack } from 'react-icons/md';
import { FaHeart, FaStar, FaCookieBite } from 'react-icons/fa';
import { useAuth } from '../../../application/hooks/useAuth';
import { isValidEmail } from '../../../domain/authValidation';
import './ForgotPasswordPage.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const { resetPassword, loading, error: authError } = useAuth();

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('El correo electrónico es obligatorio.');
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setError('Ingresa un correo electrónico válido.');
      return;
    }

    const result = await resetPassword(trimmedEmail);
    if (result.ok) {
      setEmailSent(true);
    }
  };

  return (
    <div className="forgot-page-container" data-node-id="1:727">
      <div className="forgot-card-container">
        {/* Lado Izquierdo: Visual & Branding */}
        <section className="forgot-visual-section">
          <div className="forgot-blob-1" />
          <div className="forgot-blob-2" />

          <div className="forgot-visual-content">
            <div className="forgot-mochi-wrapper">
              <img
                src={MichiMochiIMG}
                alt="Michi Mochi Illustration"
                className="forgot-mochi-img"
              />
              <div className="forgot-mochi-badge">
                <span>Sweet Security</span>
              </div>
            </div>

            <h1 className="forgot-visual-title">
              Don't Worry!
            </h1>

            <p className="forgot-visual-subtitle">
              We'll help you get back to your favorite chewy treats in no time.
            </p>

            <div className="login-visual-icons">
              <FaCookieBite title="Sweet" />
              <FaStar title="Delightful" />
              <FaHeart title="Made with love" />
            </div>
          </div>
        </section>

        {/* Lado Derecho: Formulario */}
        <section className="forgot-form-section">
          <div className="forgot-brand-header">
            <img
              src={NavbarLogo}
              alt="Michi Mochi Logo"
              className="forgot-logo"
            />
            <h2 className="forgot-form-title">
              Recuperar contraseña
            </h2>
            <p className="forgot-form-subtitle">
              Ingresa el correo electrónico asociado a tu cuenta para enviarte un enlace de restablecimiento.
            </p>
          </div>

          {emailSent ? (
            <div className="forgot-auth-success" role="alert">
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: 700 }}>
                ¡Correo enviado con éxito! ✉️
              </h3>
              <p style={{ margin: '0 0 16px 0' }}>
                Hemos enviado las instrucciones para restablecer tu contraseña a <strong>{email.trim()}</strong>. Revisa tu bandeja de entrada o spam.
              </p>
              <a href="/login" className="forgot-submit-btn" style={{ textDecoration: 'none' }}>
                Volver a Iniciar Sesión
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="forgot-form-body">
              {(error || authError) && (
                <div className="forgot-auth-error" role="alert">
                  {error || authError}
                </div>
              )}

              <div className="forgot-input-group">
                <label htmlFor="forgot-email" className="forgot-label">
                  Correo Electrónico
                </label>
                <div className="forgot-input-wrapper">
                  <MdEmail className="forgot-input-icon" />
                  <input
                    id="forgot-email"
                    type="email"
                    className={`forgot-input ${error ? 'has-error' : ''}`}
                    placeholder="ejemplo@correo.com"
                    value={email}
                    onChange={handleEmailChange}
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>
                {error && <span className="forgot-error-message">{error}</span>}
              </div>

              <button
                type="submit"
                className="forgot-submit-btn"
                disabled={loading}
                style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'wait' : 'pointer' }}
              >
                {loading ? 'Enviando enlace...' : 'Enviar correo de recuperación'}
              </button>

              <a href="/login" className="forgot-back-link">
                <MdArrowBack /> Volver a iniciar sesión
              </a>
            </form>
          )}
        </section>
      </div>

      <footer className="forgot-footer-credit">
        <p>© 2024 Michi Mochi Dessert Co. • Privacy • Terms</p>
      </footer>
    </div>
  );
}
