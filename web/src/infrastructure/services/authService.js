import { auth, googleProvider } from '../firebase/firebaseConfig';
import { signInWithPopup, sendPasswordResetEmail, signOut, GoogleAuthProvider } from 'firebase/auth';
import { apiClient } from '../http/apiClient';
import { storageAdapter } from '../storage/storageAdapter';


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

export const sendPasswordReset = async (email) => {
  const trimmedEmail = email.trim();
  try {
    await sendPasswordResetEmail(auth, trimmedEmail);
    return { ok: true };
  } catch (firebaseErr) {
    try {
      const data = await apiClient('/auth/forgot-password', {
        method: 'POST',
        body: { email: trimmedEmail },
      });
      return { ok: true, data };
    } catch {
      throw firebaseErr;
    }
  }
};

