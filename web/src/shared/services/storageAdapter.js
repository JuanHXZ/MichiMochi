/**
 * Adaptador de almacenamiento local para desacoplar el acceso directo a la API de Storage
 */

const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  IS_AUTHENTICATED: 'isAuthenticated',
  SESSION_USER: 'sessionUser',
  USER_DATA: 'usuarioData',
  CURRENCY: 'currency',
  THEME: 'michi-mochi-theme',
  CART: 'michi-mochi-cart',
  SIDEBAR: 'michi-mochi-sidebar',
};

export const storageAdapter = {
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue;
      return JSON.parse(item);
    } catch {
      return localStorage.getItem(key) ?? defaultValue;
    }
  },

  set(key, value) {
    try {
      if (typeof value === 'string') {
        localStorage.setItem(key, value);
      } else {
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (e) {
      console.error(`Error saving to localStorage key "${key}":`, e);
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error(`Error removing localStorage key "${key}":`, e);
    }
  },

  clear() {
    try {
      localStorage.clear();
    } catch (e) {
      console.error('Error clearing localStorage:', e);
    }
  },

  // Helpers específicos de sesión
  getAuthToken() {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) || null;
  },

  setAuthSession({ user, token }) {
    localStorage.setItem(STORAGE_KEYS.IS_AUTHENTICATED, 'true');
    localStorage.setItem(STORAGE_KEYS.SESSION_USER, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    if (token) {
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    }
  },

  clearAuthSession() {
    localStorage.removeItem(STORAGE_KEYS.IS_AUTHENTICATED);
    localStorage.removeItem(STORAGE_KEYS.SESSION_USER);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  },

  getSessionUser() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SESSION_USER);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  isAuthenticated() {
    return localStorage.getItem(STORAGE_KEYS.IS_AUTHENTICATED) === 'true';
  },

  STORAGE_KEYS,
};
