import { create } from 'zustand';
import { storageAdapter } from '@shared/services/storageAdapter';
import { apiClient } from '@shared/services/apiClient';

export const useAuthStore = create((set) => ({
  user: storageAdapter.getSessionUser(),
  isAuthenticated: storageAdapter.isAuthenticated(),
  isSessionVerified: false,
  token: storageAdapter.getAuthToken(),

  setSession: ({ user, token }) => {
    storageAdapter.setAuthSession({ user, token });
    set({
      user,
      isAuthenticated: true,
      isSessionVerified: true,
      token: token || storageAdapter.getAuthToken(),
    });
  },

  clearSession: () => {
    storageAdapter.clearAuthSession();
    set({
      user: null,
      isAuthenticated: false,
      isSessionVerified: false,
      token: null,
    });
  },

  syncFromStorage: () => {
    set({
      user: storageAdapter.getSessionUser(),
      isAuthenticated: storageAdapter.isAuthenticated(),
      token: storageAdapter.getAuthToken(),
    });
  },

  hydrateSession: async () => {
    try {
      const response = await apiClient('/auth/me', { requiresAuth: true });
      const freshUser = response?.data?.user;
      if (freshUser) {
        const currentToken = storageAdapter.getAuthToken();
        storageAdapter.setAuthSession({ user: freshUser, token: currentToken });
        set({
          user: freshUser,
          isAuthenticated: true,
          isSessionVerified: true,
          token: currentToken,
        });
        return freshUser;
      }
      return null;
    } catch (err) {
      if (err?.status === 401) {
        storageAdapter.clearAuthSession();
        set({
          user: null,
          isAuthenticated: false,
          isSessionVerified: false,
          token: null,
        });
      }
      return null;
    }
  },
}));
