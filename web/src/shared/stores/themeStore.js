import { create } from 'zustand';

const STORAGE_KEY = 'color-scheme';

const getSystemScheme = () => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

const getStoredScheme = () => {
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    return val === 'light' || val === 'dark' ? val : null;
  } catch {
    return null;
  }
};

const applySchemeToDocument = (storedScheme, resolvedTheme) => {
  if (typeof document === 'undefined') return;
  const meta = document.querySelector('meta[name="color-scheme"]');
  if (meta) {
    meta.setAttribute('content', storedScheme || 'light dark');
  }
  document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
};

const initialStored = getStoredScheme();
const initialResolved = initialStored || getSystemScheme();
applySchemeToDocument(initialStored, initialResolved);

export const useThemeStore = create((set, get) => ({
  theme: initialResolved,
  preference: initialStored || 'system',

  toggleTheme: () => {
    const currentRendered = get().theme;
    const target = currentRendered === 'light' ? 'dark' : 'light';
    const system = getSystemScheme();

    try {
      if (target !== system) {
        localStorage.setItem(STORAGE_KEY, target);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Ignore storage failures
    }

    const nextStored = target !== system ? target : null;
    applySchemeToDocument(nextStored, target);
    set({ theme: target, preference: nextStored || 'system' });
  },

  setTheme: (theme) => {
    const stored = theme === 'light' || theme === 'dark' ? theme : null;
    try {
      if (stored) {
        localStorage.setItem(STORAGE_KEY, stored);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Ignore storage failures
    }
    const resolved = stored || getSystemScheme();
    applySchemeToDocument(stored, resolved);
    set({ theme: resolved, preference: stored || 'system' });
  },
}));

if (typeof window !== 'undefined') {
  const media = window.matchMedia?.('(prefers-color-scheme: dark)');
  media?.addEventListener?.('change', (e) => {
    if (getStoredScheme()) return;
    const resolved = e.matches ? 'dark' : 'light';
    applySchemeToDocument(null, resolved);
    useThemeStore.setState({ theme: resolved, preference: 'system' });
  });

  window.addEventListener('storage', (e) => {
    if (e.key !== STORAGE_KEY) return;
    const stored = getStoredScheme();
    const resolved = stored || getSystemScheme();
    applySchemeToDocument(stored, resolved);
    useThemeStore.setState({ theme: resolved, preference: stored || 'system' });
  });
}
