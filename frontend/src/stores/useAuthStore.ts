// stores/useAuthStore.ts — Zustand store for authentication.
// Manages: JWT token, current user, login/logout actions.
// Token persists in localStorage so the user stays logged in across page refreshes.

import { create } from "zustand";

// Keys used to store auth data in browser localStorage
const TOKEN_STORAGE_KEY = "taskboard_token";
const REFRESH_TOKEN_STORAGE_KEY = "taskboard_refresh_token";
const USER_STORAGE_KEY = "taskboard_current_user";

// Represents the authenticated user returned by the API
export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
}

// Shape of the authentication store
// Contains auth data and actions to update it
interface AuthState {
  token: string | null;
  refreshToken: string | null;
  currentUser: AuthUser | null;
  setAuth: (token: string, refreshToken: string, currentUser: AuthUser) => void;
  setTokens: (token: string, refreshToken: string) => void;
  clearAuth: () => void;
}

// Read user information from localStorage
// Returns null if no user exists or stored data is invalid
function getStoredCurrentUser(): AuthUser | null {
  const value = localStorage.getItem(USER_STORAGE_KEY);

  if (!value) return null;

  try {
    // Parse JSON string into AuthUser object
    return JSON.parse(value) as AuthUser;
  } catch {
    // Remove corrupted data if JSON parsing fails
    localStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem(TOKEN_STORAGE_KEY),
  refreshToken: localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY),
  currentUser: getStoredCurrentUser(),

  // Store all auth data (used after login)
  setAuth: (token, refreshToken, currentUser) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(currentUser));
    set({ token, refreshToken, currentUser });
  },

  // Update only tokens, keep current user unchanged (used by refresh flow)
  setTokens: (token, refreshToken) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
    set({ token, refreshToken });
  },

  clearAuth: () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    set({ token: null, refreshToken: null, currentUser: null });
  },
}));
