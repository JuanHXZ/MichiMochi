import { useState } from 'react';
import MichiMochiIMG from '@/shared/assets/MichiMochiIMG.png';
import NavbarLogo from '@/shared/assets/navbar-logo.png';
import { FaUser, FaPhoneAlt, FaCity, FaLock, FaEye, FaEyeSlash, FaArrowRight } from 'react-icons/fa';
import { MdEmail } from 'react-icons/md';
import { FaLocationDot } from 'react-icons/fa6';
import { useCities } from '@shared/hooks/useCities';
import { useAuth } from '../../../application/hooks/useAuth';
import { validateRegistrationForm } from '../../../domain/authValidation';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import CheckIcon from '@mui/icons-material/Check';
import FormSelector from '@shared/components/FormSelector/FormSelector';
import './RegisterPage.css';

function SimpleAlert({ open, onClose }) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={3500}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert
        onClose={onClose}
        icon={<CheckIcon fontSize="inherit" />}
        severity="success"
        variant="filled"
        sx={{ width: '100%', borderRadius: '12px' }}
      >
        ¡Tu cuenta fue creada exitosamente!
      </Alert>
    </Snackbar>
  );
}

export default function RegisterPage() {
  const { cities, loading: citiesLoading } = useCities();
  const { register } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formValues, setFormValues] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    password: '',
    confirmPassword: '',
    acceptedTerms: false,
  });
  const [errors, setErrors] = useState({});
  const [passwordsMatch, setPasswordsMatch] = useState(null);
  const [accountCreated, setAccountCreated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  const handleCloseAlert = (_, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setAccountCreated(false);
  };

  const validatePasswords = () => {
    if (formValues.password.length === 0 || formValues.confirmPassword.length === 0) {
      setPasswordsMatch(null);
      return;
    }
    setPasswordsMatch(formValues.password === formValues.confirmPassword);
  };

  const handleFieldChange = (field) => (event) => {
    const nextValue = event.target.type === 'checkbox' ? event.target.checked : event.target.value;

    setFormValues((prev) => ({
      ...prev,
      [field]: nextValue,
    }));

    setServerError(null);
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];

      if (field === 'password' || field === 'confirmPassword') {
        delete next.password;
        delete next.confirmPassword;
        setPasswordsMatch(null);
      }

      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const { isValid, errors: nextErrors } = validateRegistrationForm(formValues);

    setErrors(nextErrors);
    setPasswordsMatch(
      formValues.password && formValues.confirmPassword
        ? formValues.password === formValues.confirmPassword
        : null
    );

    if (!isValid) {
      return;
    }

    setSubmitting(true);
    setServerError(null);

    const usuario = {
      fullName: formValues.fullName.trim(),
      email: formValues.email.trim(),
      phone: formValues.phone.trim(),
      address: formValues.address.trim(),
      city: String(formValues.city),
      password: formValues.password,
      acceptedTerms: formValues.acceptedTerms,
    };

    const result = await register(usuario);

    if (result.ok) {
      setAccountCreated(true);
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1500);
    } else {
      setServerError(result.message || 'Error al registrar el usuario en el servidor.');
    }
    setSubmitting(false);
  };

  const showPasswordValidation = passwordsMatch !== null;

  return (
    <div className="register-page-container" data-node-id="1:1092">
      <SimpleAlert open={accountCreated} onClose={handleCloseAlert} />

      {/* Lado Izquierdo: Sweetness Delivered Composition */}
      <section className="register-visual-section" data-node-id="1:1093">
        <div className="register-blur-1" data-node-id="1:1095" />
        <div className="register-blur-2" data-node-id="1:1096" />

        <div className="register-visual-content" data-node-id="1:1100">
          <div className="register-hero-img-wrapper" data-node-id="1:1098">
            <img
              src={MichiMochiIMG}
              alt="Michi Mochi Sweetness"
              className="register-hero-img"
            />
          </div>

          <h1 className="register-visual-title" data-node-id="1:1102">
            Sweetness Delivered
          </h1>

          <p className="register-visual-subtitle" data-node-id="1:1104">
            Experimenta la suavidad y el sabor de nuestros mochis artesanales, llevados directamente a tu puerta con amor.
          </p>
        </div>
      </section>

      {/* Lado Derecho: Formulario de Registro */}
      <section className="register-form-section" data-node-id="1:1105">
        <div className="register-form-container" data-node-id="1:1109">
          <div className="register-brand-header" data-node-id="1:1110">
            <img
              src={NavbarLogo}
              alt="Michi Mochi Logo"
              className="register-logo"
              data-node-id="1:1111"
            />
            <h2 className="register-form-title" data-node-id="1:1112">
              Crear nueva cuenta
            </h2>
            <p className="register-form-subtitle" data-node-id="1:1113">
              Únete a la familia Michi Mochi y disfruta de pedidos rápidos y dulces recompensas.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="register-form-body" data-node-id="1:1114">
            {serverError && (
              <div
                className="register-auth-error"
                style={{
                  color: '#d32f2f',
                  backgroundColor: '#ffebee',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  marginBottom: '12px',
                }}
              >
                {serverError}
              </div>
            )}

            {/* Nombre Completo */}
            <div className="register-input-group" data-node-id="1:1116">
              <label htmlFor="reg-fullname" className="register-label" data-node-id="1:1118">
                Nombre completo
              </label>
              <div className="register-input-wrapper" data-node-id="1:1119">
                <FaUser className="register-input-icon" data-node-id="1:1124" />
                <input
                  id="reg-fullname"
                  type="text"
                  className={`register-input ${errors.fullName ? 'has-error' : ''}`}
                  placeholder="Ej. Juan Pérez"
                  value={formValues.fullName}
                  onChange={handleFieldChange('fullName')}
                  autoComplete="name"
                  data-node-id="1:1120"
                />
              </div>
              {errors.fullName && <span className="register-error-message">{errors.fullName}</span>}
            </div>

            {/* Email & Phone Row */}
            <div className="register-row-2col" data-node-id="1:1125">
              <div className="register-input-group" data-node-id="1:1126">
                <label htmlFor="reg-email" className="register-label" data-node-id="1:1128">
                  Correo Electrónico
                </label>
                <div className="register-input-wrapper" data-node-id="1:1129">
                  <MdEmail className="register-input-icon" data-node-id="1:1134" />
                  <input
                    id="reg-email"
                    type="email"
                    className={`register-input ${errors.email ? 'has-error' : ''}`}
                    placeholder="nombre@ejemplo.com"
                    value={formValues.email}
                    onChange={handleFieldChange('email')}
                    autoComplete="email"
                    data-node-id="1:1130"
                  />
                </div>
                {errors.email && <span className="register-error-message">{errors.email}</span>}
              </div>

              <div className="register-input-group" data-node-id="1:1135">
                <label htmlFor="reg-phone" className="register-label" data-node-id="1:1137">
                  Número de Teléfono
                </label>
                <div className="register-input-wrapper" data-node-id="1:1138">
                  <FaPhoneAlt className="register-input-icon" data-node-id="1:1143" />
                  <input
                    id="reg-phone"
                    type="tel"
                    className={`register-input ${errors.phone ? 'has-error' : ''}`}
                    placeholder="+57 3..."
                    value={formValues.phone}
                    onChange={handleFieldChange('phone')}
                    autoComplete="tel"
                    data-node-id="1:1139"
                  />
                </div>
                {errors.phone && <span className="register-error-message">{errors.phone}</span>}
              </div>
            </div>

            {/* Address & City Row */}
            <div className="register-row-2col" data-node-id="1:1144">
              <div className="register-input-group" data-node-id="1:1145">
                <label htmlFor="reg-address" className="register-label" data-node-id="1:1147">
                  Dirección de entrega
                </label>
                <div className="register-input-wrapper" data-node-id="1:1148">
                  <FaLocationDot className="register-input-icon" data-node-id="1:1153" />
                  <input
                    id="reg-address"
                    type="text"
                    className={`register-input ${errors.address ? 'has-error' : ''}`}
                    placeholder="Calle y número"
                    value={formValues.address}
                    onChange={handleFieldChange('address')}
                    autoComplete="street-address"
                    data-node-id="1:1149"
                  />
                </div>
                {errors.address && <span className="register-error-message">{errors.address}</span>}
              </div>

              <div className="register-input-group" data-node-id="1:1154">
                <label htmlFor="reg-city" className="register-label" data-node-id="1:1156">
                  Ciudad
                </label>
                <FormSelector
                  icon={FaCity}
                  placeholder={citiesLoading ? 'Cargando ciudades...' : 'Selecciona tu ciudad'}
                  options={cities}
                  value={formValues.city}
                  onChange={handleFieldChange('city')}
                  className={errors.city ? 'has-error' : ''}
                  data-node-id="1:1158"
                />
                {errors.city && <span className="register-error-message">{errors.city}</span>}
              </div>
            </div>

            {/* Password */}
            <div className="register-input-group" data-node-id="1:1163">
              <label htmlFor="reg-password" className="register-label" data-node-id="1:1165">
                Contraseña
              </label>
              <div className="register-input-wrapper" data-node-id="1:1166">
                <FaLock className="register-input-icon" data-node-id="1:1171" />
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  className={`register-input ${errors.password ? 'has-error' : ''}`}
                  placeholder="••••••••"
                  value={formValues.password}
                  onChange={handleFieldChange('password')}
                  onBlur={validatePasswords}
                  autoComplete="new-password"
                  data-node-id="1:1167"
                />
                <button
                  type="button"
                  className="register-password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.password && <span className="register-error-message">{errors.password}</span>}
            </div>

            {/* Confirm Password */}
            <div className="register-input-group" data-node-id="1:1172">
              <label htmlFor="reg-confirm-password" className="register-label" data-node-id="1:1174">
                Confirmar contraseña
              </label>
              <div className="register-input-wrapper" data-node-id="1:1175">
                <FaLock className="register-input-icon" data-node-id="1:1180" />
                <input
                  id="reg-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className={`register-input ${errors.confirmPassword ? 'has-error' : ''}`}
                  placeholder="••••••••"
                  value={formValues.confirmPassword}
                  onChange={handleFieldChange('confirmPassword')}
                  onBlur={validatePasswords}
                  autoComplete="new-password"
                  data-node-id="1:1176"
                />
                <button
                  type="button"
                  className="register-password-toggle"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={showConfirmPassword ? 'Ocultar confirmación' : 'Mostrar confirmación'}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.confirmPassword && (
                <span className="register-error-message">{errors.confirmPassword}</span>
              )}
              {showPasswordValidation && !errors.confirmPassword && (
                <span
                  className={`register-password-feedback ${passwordsMatch ? 'is-valid' : 'is-invalid'}`}
                >
                  {passwordsMatch ? '✓ Las contraseñas coinciden' : '✕ Las contraseñas no coinciden'}
                </span>
              )}
            </div>

            {/* Terms Checkbox */}
            <div className="register-terms-row" data-node-id="1:1181">
              <input
                id="reg-terms"
                type="checkbox"
                className="register-checkbox"
                checked={formValues.acceptedTerms}
                onChange={handleFieldChange('acceptedTerms')}
                data-node-id="1:1183"
              />
              <label htmlFor="reg-terms" className="register-terms-label" data-node-id="1:1185">
                Acepto los{' '}
                <span className="register-terms-link">términos y condiciones</span> de servicio y la{' '}
                <span className="register-terms-link">política de privacidad</span>.
              </label>
            </div>
            {errors.acceptedTerms && (
              <span className="register-error-message">{errors.acceptedTerms}</span>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="register-submit-btn"
              disabled={submitting}
              style={{ opacity: submitting ? 0.7 : 1, cursor: submitting ? 'wait' : 'pointer' }}
              data-node-id="1:1186"
            >
              <span data-node-id="1:1189">{submitting ? 'Creando cuenta...' : 'Crear cuenta'}</span>
              <FaArrowRight size={14} />
            </button>

            {/* Footer Link to Login */}
            <div className="register-login-prompt" data-node-id="1:1192">
              <span>Ya tengo una cuenta.</span>
              <a href="/login" className="register-login-link" data-node-id="1:1193">
                Iniciar sesión
              </a>
            </div>
          </form>
        </div>

        {/* Decorative corner image */}
        <div className="register-corner-decoration" data-node-id="1:1194">
          <img src={MichiMochiIMG} alt="" />
        </div>
      </section>
    </div>
  );
}
