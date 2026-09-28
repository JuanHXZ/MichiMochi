import { useState, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import {
  loginWithEmailPassword,
  registerWithEmailPassword,
  loginWithGoogle,
  logout as logoutService,
  sendPasswordReset,
  requestPasswordResetOtp,
  verifyOtpCode,
  resetPasswordWithToken as resetPasswordService,
} from '../../infrastructure/services/authService';

/**
 * Hook de aplicación para gestionar todo el ciclo de vida de autenticación
 */
export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);

  const login = useCallback(
    async (email, password) => {
      setLoading(true);
      setError(null);
      try {
        const loggedUser = await loginWithEmailPassword(email, password);
        setSession({ user: loggedUser });
        return { ok: true, user: loggedUser };
      } catch (err) {
        const message = err.message || 'Error al iniciar sesión.';
        setError(message);
        return { ok: false, message };
      } finally {
        setLoading(false);
      }
    },
    [setSession]
  );

  const register = useCallback(
    async (registrationData) => {
      setLoading(true);
      setError(null);
      try {
        const registeredUser = await registerWithEmailPassword(registrationData);
        setSession({ user: registeredUser });
        return { ok: true, user: registeredUser };
      } catch (err) {
        const message = err.message || 'Error al registrar la cuenta.';
        setError(message);
        return { ok: false, message };
      } finally {
        setLoading(false);
      }
    },
    [setSession]
  );

  const signInWithGoogleAction = useCallback(
    async (onSuccess) => {
      setLoading(true);
      setError(null);
      try {
        const googleUser = await loginWithGoogle();
        setSession({ user: googleUser });
        if (onSuccess) {
          onSuccess(googleUser);
        }
        return { ok: true, user: googleUser };
      } catch (err) {
        let errorMessage = 'Ocurrió un error al iniciar sesión con Google.';
        if (err.code === 'auth/popup-closed-by-user') {
          errorMessage = 'La ventana de inicio de sesión de Google fue cerrada.';
        } else if (err.code === 'auth/network-request-failed') {
          errorMessage = 'Error de red al conectar con los servidores de autenticación.';
        } else if (err.code === 'auth/unauthorized-domain') {
          errorMessage = 'El dominio no está autorizado en Firebase Console.';
        } else if (err.message) {
          errorMessage = err.message;
        }
        setError(errorMessage);
        return { ok: false, message: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [setSession]
  );

  const logoutAction = useCallback(async () => {
    await logoutService();
    clearSession();
  }, [clearSession]);

  const resetPassword = useCallback(async (email) => {
    setLoading(true);
    setError(null);
    try {
      const response = await sendPasswordReset(email);
      return { ok: true, ...response };
    } catch (err) {
      let msg = 'Error al enviar el código de recuperación.';
      if (err.code === 'auth/user-not-found') {
        msg = 'No existe una cuenta registrada con este correo.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'El formato del correo es inválido.';
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
      return { ok: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const requestOtp = useCallback(async (email) => {
    setLoading(true);
    setError(null);
    try {
      const response = await requestPasswordResetOtp(email);
      return { ok: true, data: response };
    } catch (err) {
      const msg = err.message || 'Error al solicitar el código de recuperación.';
      setError(msg);
      return { ok: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyOtp = useCallback(async (email, code) => {
    setLoading(true);
    setError(null);
    try {
      const result = await verifyOtpCode(email, code);
      return { ok: true, data: result };
    } catch (err) {
      const msg = err.message || 'Error al verificar el código.';
      setError(msg);
      return { ok: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPasswordWithToken = useCallback(async (email, resetToken, newPassword) => {
    setLoading(true);
    setError(null);
    try {
      const response = await resetPasswordService(email, resetToken, newPassword);
      return { ok: true, data: response };
    } catch (err) {
      const msg = err.message || 'Error al restablecer la contraseña.';
      setError(msg);
      return { ok: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    user,
    isAuthenticated,
    loading,
    error,
    setError,
    login,
    register,
    signInWithGoogle: signInWithGoogleAction,
    logout: logoutAction,
    resetPassword,
    requestOtp,
    verifyOtp,
    resetPasswordWithToken,
  };
}

