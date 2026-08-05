// components/AuthGuard.tsx
// Redirects unauthenticated users to /login.
// Wrap protected pages with this component.

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Navigate } from "react-router-dom";
import { getCurrentUser } from "@/features/auth/api/authApi";
import { useAuthStore } from "@/stores/useAuthStore";

/**
 * AuthGuard Component
 * Wraps protected routes to ensure the user is authenticated.
 * Always calls GET /api/auth/me to verify the token with the backend.
 * If backend returns 401, apiClient interceptor handles logout automatically.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  // Extract state and actions from Zustand store
  const token = useAuthStore((s) => s.token);
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const queryClient = useQueryClient();

  // Always verify token with backend when token exists
  const {
    data: fetchedUser,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: getCurrentUser,
    enabled: Boolean(token),
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message === "Unauthorized") {
        return false;
      }

      return failureCount < 2;
    },
    // Avoid re-calling /me on every page navigation
    staleTime: 5 * 60 * 1000,
  });

  // Update Zustand store with fetched user data when available
  useEffect(() => {
    if (token && fetchedUser) {
      const { refreshToken, clearAuth } = useAuthStore.getState();
      if (refreshToken) {
        setAuth(token, refreshToken, fetchedUser);
      } else {
        clearAuth();
      }
    }
  }, [token, fetchedUser, setAuth]);

  // Backend returned 401 → clear corrupt data
  useEffect(() => {
    if (error instanceof Error && error.message === "Unauthorized") {
      queryClient.clear();
      clearAuth();
    }
  }, [error, clearAuth, queryClient]);

  // --- Rendering Logic ---
  // No token at all -> Kick back to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Fetch failed (invalid/expired token) -> Kick back to login
  const isAuthError =
    error instanceof Error && error.message === "Unauthorized";

  if (isAuthError) {
    return <Navigate to="/login" replace />;
  }

  // Still fetching user data -> Show spinner
  if (isLoading) {
    return (
      <div
        role="status"
        aria-busy="true"
        aria-live="polite"
        className="flex min-h-screen items-center justify-center bg-background"
      >
        <Loader2
          className="h-6 w-6 animate-spin text-muted-foreground"
          aria-hidden="true"
        />
        <span className="sr-only">Checking your session...</span>
      </div>
    );
  }

  // All checks passed -> Render the protected page
  return <>{children}</>;
}
