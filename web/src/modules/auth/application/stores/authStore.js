import { create } from 'zustand';
import { storageAdapter } from '@shared/services/storageAdapter';

export const useAuthStore = create((set) => ({
  user: storageAdapter.getSessionUser(),
  isAuthenticated: storageAdapter.isAuthenticated(),
  token: storageAdapter.getAuthToken(),

  setSession: ({ user, token }) => {
    storageAdapter.setAuthSession({ user, token });
    set({
      user,
      isAuthenticated: true,
      token: token || null,
    });
  },

  clearSession: () => {
    storageAdapter.clearAuthSession();
    set({
      user: null,
      isAuthenticated: false,
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
}));
