import { create } from 'zustand';

if (typeof window !== 'undefined') {
  try {
    window.localStorage.removeItem('michi-mochi-sidebar');
  } catch {
    // Ignore storage access errors
  }
}

export const useSidebarStore = create((set) => ({
  isOpen: false,
  openSidebar: () => set({ isOpen: true }),
  closeSidebar: () => set({ isOpen: false }),
  toggleSidebar: () => set((state) => ({ isOpen: !state.isOpen })),
}));
