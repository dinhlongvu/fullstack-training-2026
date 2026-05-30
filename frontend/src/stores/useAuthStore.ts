// stores/useAuthStore.ts — Zustand store for authentication.
// Manages: JWT token, current user, login/logout actions.
// Token persists in localStorage so the user stays logged in across page refreshes.

import { create } from 'zustand';

export interface User {
  id: number;
  email: string;
  fullName: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  user: null,
  login: (token, user) => {
    localStorage.setItem('token', token);
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null });
  },
}));
