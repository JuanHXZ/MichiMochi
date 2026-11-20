import { create } from 'zustand';

let nextToastId = 1;

export const useToastStore = create((set, get) => ({
  toasts: [],
  announcement: '',

  showToast: ({ message, type = 'info', duration = 4500 }) => {
    const id = `toast-${nextToastId++}`;
    const hasModal =
      typeof document !== 'undefined' && Boolean(document.querySelector('dialog:modal'));
    let nextAnnouncement = get().announcement;

    if (!hasModal && typeof document !== 'undefined') {
      if (typeof document.ariaNotify === 'function') {
        document.ariaNotify(message);
      } else {
        nextAnnouncement = message;
      }
    }

    set((state) => ({
      toasts: [...state.toasts, { id, message, type, createdAt: Date.now() }],
      announcement: nextAnnouncement,
    }));

    if (duration > 0) {
      setTimeout(() => {
        const activeEl = document.activeElement;
        const toastEl = document.getElementById(id);
        // Pause auto-dismiss if user focus is currently inside the toast
        if (toastEl && activeEl && toastEl.contains(activeEl)) {
          return;
        }
        get().dismissToast(id);
      }, duration);
    }

    return id;
  },

  dismissToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));
