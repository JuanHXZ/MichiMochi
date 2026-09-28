import { auth, googleProvider } from '@shared/services/firebaseConfig';
import { signInWithPopup, sendPasswordResetEmail, signOut, GoogleAuthProvider } from 'firebase/auth';
import { apiClient } from '@shared/services/apiClient';
import { storageAdapter } from '@shared/services/storageAdapter';


export const loginWithEmailPassword = async (email, password) => {
  const data = await apiClient('/auth/login', {
    method: 'POST',
    body: {
      email: email.trim(),
      password: password.trim(),
    },
  });

  const { user, tokens } = data.data;

  storageAdapter.setAuthSession({
    user,
    token: tokens.accessToken,
  });

  return user;
};

export const registerWithEmailPassword = async (registrationData) => {
  const data = await apiClient('/auth/register', {
    method: 'POST',
    body: registrationData,
  });

  const { user, tokens } = data.data;

  storageAdapter.setAuthSession({
    user,
    token: tokens.accessToken,
  });

  return user;
};

export const loginWithGoogle = async () => {
  const userCredential = await signInWithPopup(auth, googleProvider);
  // Forzar obtención del token más reciente
  const idToken = await userCredential.user.getIdToken(true);
  const credential = GoogleAuthProvider.credentialFromResult(userCredential);
  const oauthToken = credential?.idToken;

  const data = await apiClient('/auth/google', {
    method: 'POST',
    body: {
      idToken,
      ...(oauthToken ? { oauthToken } : {}),
    },
  });

  const { user, tokens } = data.data;

  storageAdapter.setAuthSession({
    user,
    token: tokens.accessToken,
  });

  return user;
};

export const logout = async () => {
  storageAdapter.clearAuthSession();
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('Error al cerrar sesión de Firebase en cliente:', err);
  }
};

export const logoutFirebase = logout;

export const requestPasswordResetOtp = async (email) => {
  const data = await apiClient('/auth/forgot-password', {
    method: 'POST',
    body: { email: email.trim() },
  });
  return data;
};

export const verifyOtpCode = async (email, code) => {
  const data = await apiClient('/auth/verify-otp', {
    method: 'POST',
    body: {
      email: email.trim(),
      code: code.trim(),
    },
  });
  return data.data; // { verified: true, resetToken: string, message: string }
};

export const resetPasswordWithToken = async (email, resetToken, newPassword) => {
  const data = await apiClient('/auth/reset-password', {
    method: 'POST',
    body: {
      email: email.trim(),
      resetToken,
      newPassword,
    },
  });
  return data;
};

export const sendPasswordReset = async (email) => {
  const trimmedEmail = email.trim();
  // Primero intentamos la ruta OTP del backend
  try {
    const data = await requestPasswordResetOtp(trimmedEmail);
    return { ok: true, data };
  } catch (backendErr) {
    // Si falla el backend, intentamos fallback a Firebase si aplica
    try {
      await sendPasswordResetEmail(auth, trimmedEmail);
      return { ok: true };
    } catch {
      throw backendErr;
    }
  }
};

