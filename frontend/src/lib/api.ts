// lib/api.ts — Shared API fetch wrapper.
// Automatically attaches JWT token from Zustand auth store.
// All API calls in the app go through this function.

import { useAuthStore } from "@/stores/useAuthStore";

// Backend API base URL loaded from environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL;

// Expected structure of API error responses
interface ApiErrorResponse {
  error?: string;
  message?: string;
}

async function getErrorMessage(response: Response): Promise<string> {
  // Default error message when API doesn't provide one
  const fallbackMessage = "HTTP ${response.status}";

  try {
    const body = (await response.json()) as ApiErrorResponse;
    return body.message ?? body.error ?? fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

// Redirect unauthenticated users to login page
function redirectToLogin() {
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

// Generic API client used by the entire application
export async function apiClient<TResponse>(
  path: string,
  options: RequestInit = {},
): Promise<TResponse> {
  // Read current authentication state from Zustand
  const { token, clearAuth } = useAuthStore.getState();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    // Automatically attach JWT token if available
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    // Allow custom request headers to override defaults
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  // User is no longer authenticated
  // Clear local auth state and redirect to login
  if (response.status === 401) {
    clearAuth();
    redirectToLogin();
    throw new Error("Unauthorized");
  }

  // Convert API error response into readable message
  if (!response.ok) {
    const message = await getErrorMessage(response);
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as TResponse; // No response body
  }

  return response.json() as Promise<TResponse>;
}
