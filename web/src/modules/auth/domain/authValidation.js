import { BUSINESS_CONSTANTS } from '@shared/constants/businessConstants';

/**
 * Validaciones de dominio para Autenticación y Registro de Usuarios
 */

export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

export const isValidColombianPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  return BUSINESS_CONSTANTS.COLOMBIAN_PHONE_REGEX.test(phone.trim());
};

export const isValidFullName = (name) => {
  if (!name || typeof name !== 'string') return false;
  return BUSINESS_CONSTANTS.NAME_REGEX.test(name.trim());
};

export const validateLoginForm = ({ email, password }) => {
  const errors = {};
  const trimmedEmail = (email || '').trim();
  const trimmedPassword = (password || '').trim();

  if (!trimmedEmail) {
    errors.email = 'El correo electrónico es obligatorio.';
  } else if (!isValidEmail(trimmedEmail)) {
    errors.email = 'Ingresa un correo electrónico válido.';
  }

  if (!trimmedPassword) {
    errors.password = 'La contraseña es obligatoria.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateRegistrationForm = (formValues) => {
  const errors = {};
  const fullName = (formValues.fullName || '').trim();
  const email = (formValues.email || '').trim();
  const phone = (formValues.phone || '').trim();
  const address = (formValues.address || '').trim();
  const city = formValues.city;
  const password = formValues.password || '';
  const confirmPassword = formValues.confirmPassword || '';
  const acceptedTerms = Boolean(formValues.acceptedTerms);

  if (!fullName) {
    errors.fullName = 'El nombre completo es obligatorio.';
  } else if (!isValidFullName(fullName)) {
    errors.fullName = 'El nombre solo debe contener letras y espacios.';
  }

  if (!email) {
    errors.email = 'El correo electrónico es obligatorio.';
  } else if (!isValidEmail(email)) {
    errors.email = 'Ingresa un correo electrónico válido.';
  }

  if (!phone) {
    errors.phone = 'El número de teléfono es obligatorio.';
  } else if (!isValidColombianPhone(phone)) {
    errors.phone = 'El número debe contener exactamente 10 dígitos (iniciando con 3).';
  }

  if (!address) {
    errors.address = 'La dirección de entrega es obligatoria.';
  }

  if (!city) {
    errors.city = 'Debes seleccionar una ciudad.';
  }

  if (!password) {
    errors.password = 'La contraseña es obligatoria.';
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Debes confirmar la contraseña.';
  }

  if (password && confirmPassword && password !== confirmPassword) {
    errors.confirmPassword = 'Las contraseñas no coinciden.';
  }

  if (!acceptedTerms) {
    errors.acceptedTerms = 'Debes aceptar los términos y condiciones.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
