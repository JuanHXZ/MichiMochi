import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useSidebarStore = create(
  persist(
    (set) => ({
      isOpen: false,
      openSidebar: () => set({ isOpen: true }),
      closeSidebar: () => set({ isOpen: false }),
      toggleSidebar: () => set((state) => ({ isOpen: !state.isOpen })),
    }),
    {
      name: 'michi-mochi-sidebar',
    }
  )
);
