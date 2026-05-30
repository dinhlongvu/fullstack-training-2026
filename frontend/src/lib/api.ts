// lib/api.ts — Shared API fetch wrapper.
// Automatically attaches JWT token from Zustand auth store.
// All API calls in the app go through this function.

import { useAuthStore } from '@/stores/useAuthStore';

const API_BASE = '/api';

export interface ApiError {
  error: string;
}

export async function apiFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const token = useAuthStore.getState().token;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(body.error || `HTTP ${response.status}`);
  }

  // Handle 204 No Content
  if (response.status === 204) return undefined as T;

  return response.json();
}
