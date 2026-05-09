import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  admin: null,
  isLoading: true,

  setAdmin: (admin) => set({ admin, isLoading: false }),
  clearAdmin: () => set({ admin: null, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
}));
