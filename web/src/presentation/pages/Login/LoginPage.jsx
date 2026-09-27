import { useState } from 'react';
import MichiMochiIMG from '@/shared/assets/MichiMochiIMG.png';
import NavbarLogo from '@/shared/assets/navbar-logo.png';
import { FaLock, FaEye, FaEyeSlash, FaHeart, FaStar, FaCookieBite } from 'react-icons/fa';
import { MdEmail } from 'react-icons/md';
import { useAuth } from '@/application/hooks/useAuth';
import { validateLoginForm } from '@/domain/validations/authValidation';
import './LoginPage.css';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [formValues, setFormValues] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});

  const { login, signInWithGoogle, loading, error: authError } = useAuth();

  const handleFieldChange = (field) => (event) => {
    const nextValue = event.target.value;

    setFormValues((prev) => ({
      ...prev,
      [field]: nextValue,
    }));

    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      delete next.auth;
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const { isValid, errors: validationErrors } = validateLoginForm(formValues);

    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    const result = await login(formValues.email, formValues.password);
    if (result.ok) {
      window.location.href = '/dashboard';
    } else {
      setErrors({ auth: result.message || 'Error al iniciar sesión.' });
    }
  };

  const handleGoogleLogin = async () => {
    await signInWithGoogle(() => {
      window.location.href = '/dashboard';
    });
  };

  return (
    <div className="login-page-container" data-node-id="1:408">
      <div className="login-card-container" data-node-id="1:409">
        {/* Lado Izquierdo: Branding & Visual */}
        <section className="login-visual-section" data-node-id="1:410">
          <div className="login-blob-1" data-node-id="1:411" />
          <div className="login-blob-2" data-node-id="1:412" />

          <div className="login-visual-content" data-node-id="1:413">
            <div className="login-mochi-wrapper" data-node-id="1:425">
              <img
                src={MichiMochiIMG}
                alt="Michi Mochi Playful Illustration"
                className="login-mochi-img"
              />
              <div className="login-mochi-badge" data-node-id="1:427">
                <span>Mmm... Mochi!</span>
              </div>
            </div>

            <h1 className="login-visual-title" data-node-id="1:415">
              Join the Sweetness
            </h1>

            <p className="login-visual-subtitle" data-node-id="1:417">
              Step into a world of chewy, creamy, and delightful treats. Your daily dose of happiness is just a sign-in away!
            </p>

            <div className="login-visual-icons" data-node-id="1:418">
              <FaCookieBite title="Sweet" />
              <FaStar title="Delightful" />
              <FaHeart title="Made with love" />
            </div>
          </div>
        </section>

        {/* Lado Derecho: Formulario de Inicio de Sesión */}
        <section className="login-form-section" data-node-id="1:431">
          <div className="login-brand-header" data-node-id="1:433">
            <img
              src={NavbarLogo}
              alt="Michi Mochi Logo"
              className="login-logo"
              data-node-id="1:435"
            />
            <h2 className="login-form-title" data-node-id="1:437">
              Welcome Back
            </h2>
            <p className="login-form-subtitle" data-node-id="1:438">
              Please enter your details to access your account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="login-form-body" data-node-id="1:439">
            {(errors.auth || authError) && (
              <div className="login-auth-error" role="alert">
                {errors.auth || authError}
              </div>
            )}

            {/* Email Field */}
            <div className="login-input-group" data-node-id="1:440">
              <label htmlFor="login-email" className="login-label" data-node-id="1:442">
                Email Address
              </label>
              <div className="login-input-wrapper" data-node-id="1:443">
                <MdEmail className="login-input-icon" />
                <input
                  id="login-email"
                  type="email"
                  className={`login-input ${errors.email ? 'has-error' : ''}`}
                  placeholder="hello@example.com"
                  value={formValues.email}
                  onChange={handleFieldChange('email')}
                  autoComplete="email"
                />
              </div>
              {errors.email && <span className="login-error-message">{errors.email}</span>}
            </div>

            {/* Password Field */}
            <div className="login-input-group" data-node-id="1:449">
              <div className="login-label-row">
                <label htmlFor="login-password" className="login-label" data-node-id="1:452">
                  Password
                </label>
                <a href="/forgot-password" className="login-forgot-link" data-node-id="1:454">
                  Forgot password?
                </a>
              </div>
              <div className="login-input-wrapper" data-node-id="1:455">
                <FaLock className="login-input-icon" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className={`login-input ${errors.password ? 'has-error' : ''}`}
                  placeholder="••••••••"
                  value={formValues.password}
                  onChange={handleFieldChange('password')}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  data-node-id="1:461"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.password && <span className="login-error-message">{errors.password}</span>}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="login-submit-btn"
              disabled={loading}
              style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'wait' : 'pointer' }}
              data-node-id="1:464"
            >
              {loading ? 'Iniciando sesión...' : 'Sign In'}
            </button>

            {/* Divider */}
            <div className="login-divider-row" data-node-id="1:480">
              <div className="login-divider-line" />
              <span className="login-divider-text" data-node-id="1:485">
                or continue with
              </span>
              <div className="login-divider-line" />
            </div>

            {/* Google Social Login */}
            <button
              type="button"
              className="login-google-btn"
              onClick={handleGoogleLogin}
              disabled={loading}
              data-node-id="1:468"
              style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'wait' : 'pointer' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" data-node-id="1:469">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>{loading ? 'Iniciando sesión...' : 'Continue with Google'}</span>
            </button>

            {/* Sign Up Link */}
            <div className="login-signup-prompt" data-node-id="1:477">
              <span>Don't have an account?</span>
              <a href="/register" className="login-signup-link" data-node-id="1:478">
                Sign up for free
              </a>
            </div>
          </form>
        </section>
      </div>

      {/* Footer Credit */}
      <footer className="login-footer-credit" data-node-id="1:486">
        <p data-node-id="1:488">© 2024 Michi Mochi Dessert Co. • Privacy • Terms</p>
      </footer>
    </div>
  );
}
