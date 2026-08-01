// lib/api.ts — Shared API fetch wrapper.
// Automatically attaches JWT token from Zustand auth store.
// On 401: attempts a single token refresh before logging out.
// All API calls in the app go through this function.

import { useAuthStore } from "@/stores/useAuthStore";
import { refreshTokenRequest } from "@/features/auth/api/authApi";

// Backend API base URL loaded from environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL;

// Expected structure of API error responses
interface ApiErrorResponse {
  error?: string;
  message?: string;
  errors?: string[];
}

const AUTH_ENDPOINTS = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/refresh",
];

// Single-flight guard: ensures only one refresh request fires at a time.
// When multiple requests receive 401 simultaneously, they all await the same promise.
let refreshPromise: Promise<{
  token: string;
  refreshToken: string;
}> | null = null;

async function getErrorMessage(response: Response): Promise<string> {
  // Default error message when API doesn't provide one
  const fallbackMessage = `HTTP ${response.status}`;

  try {
    const body = (await response.json()) as ApiErrorResponse;
    return body.message ?? body.error ?? body.errors?.join(", ") ?? fallbackMessage;
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

// Clear auth state and redirect 
function forceLogout() {
  const { clearAuth } = useAuthStore.getState();
  clearAuth();
  redirectToLogin();
}

// Generic API client used by the entire application
export async function apiClient<TResponse>(
  path: string,
  options: RequestInit = {},
): Promise<TResponse> {
  // Read current authentication state from Zustand
  const { token } = useAuthStore.getState();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    // Automatically attach JWT token if available
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    // Allow custom request headers to override defaults
    ...options.headers,
  };

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    // fetch only rejects on a network-level failure: offline, DNS, CORS.
    // Its own message is "Failed to fetch", which ends up in a toast as-is.
    throw new Error("Can't reach the server. Check your connection and try again.");
  }

  // Handle 401 Unauthorized — attempt token refresh before logging out
  if (response.status === 401) {
    // Never attempt refresh for auth endpoints (avoid infinite loops)
    const isAuthEndpoint = AUTH_ENDPOINTS.some((ep) => path.startsWith(ep));
    if (isAuthEndpoint) {
      forceLogout();
      throw new Error("Unauthorized");
    }

    // Check if we have a refresh token
    const { refreshToken, setTokens } = useAuthStore.getState();
    if (!refreshToken) {
      forceLogout();
      throw new Error("Unauthorized");
    }

    // Attempt to refresh the access token
    let newTokens: { token: string; refreshToken: string };
    try {
      // Single-flight: reuse in-progress refresh if one exists
      if (!refreshPromise) {
        refreshPromise = refreshTokenRequest(refreshToken);
      }
      newTokens = await refreshPromise;
    } catch {
      // Refresh failed — token is invalid/expired/revoked
      forceLogout();
      throw new Error("Unauthorized");
    } finally {
      // Once refresh attempt completes, clear the promise so future 401s trigger a new attempt
      refreshPromise = null;
    }

    // Refresh succeeded — update store with new tokens
    setTokens(newTokens.token, newTokens.refreshToken);

    // Retry the original request with the new access token
    const retryHeaders: HeadersInit = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${newTokens.token}`,
      ...options.headers,
    };

    const retryResponse = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: retryHeaders,
    });

    // Retry still unauthorized — give up
    if (retryResponse.status === 401) {
      forceLogout();
      throw new Error("Unauthorized");
    }

    // Convert API error response into readable message
    if (!retryResponse.ok) {
      const message = await getErrorMessage(retryResponse);
      throw new Error(message);
    }

    if (retryResponse.status === 204) {
      return undefined as TResponse;
    }

    return retryResponse.json();
  }

  // Convert API error response into readable message
  if (!response.ok) {
    const message = await getErrorMessage(response);
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as TResponse; // No response body
  }

  return response.json();
}
