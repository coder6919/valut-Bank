import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../hooks/api';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      role: null,
      isAuthenticated: false,
      error: null,
      loading: false,

      login: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const response = await api.post('/auth/login', { email, password });
          const { token, name, role } = response.data;
          
          set({
            user: { email, name },
            token,
            role,
            isAuthenticated: true,
            loading: false,
          });
          return { success: true, role };
        } catch (err) {
          const errMsg = err.response?.data || 'Invalid email or password';
          set({ error: errMsg, loading: false });
          return { success: false, error: errMsg };
        }
      },

      register: async (name, email, password, phone, role) => {
        set({ loading: true, error: null });
        try {
          await api.post('/auth/register', { name, email, password, phone, role });
          set({ loading: false });
          return { success: true };
        } catch (err) {
          const errMsg = err.response?.data || 'Registration failed';
          set({ error: errMsg, loading: false });
          return { success: false, error: errMsg };
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          role: null,
          isAuthenticated: false,
          error: null,
        });
      },
    }),
    {
      name: 'vaultbank-auth', // localStorage key
    }
  )
);