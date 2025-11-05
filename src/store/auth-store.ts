import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

/**
 * Authentication store using Zustand
 *
 * Manages global authentication state including:
 * - Current user
 * - Loading states
 * - Error handling
 */

interface AuthStore {
  user: User | null;
  loading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      loading: false,
      error: null,

      setUser: (user) => set({ user, error: null }),

      setLoading: (loading) => set({ loading }),

      setError: (error) => set({ error, loading: false }),

      clearAuth: () => set({ user: null, loading: false, error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
);
