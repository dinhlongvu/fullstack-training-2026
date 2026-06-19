// components/AuthGuard.tsx
// Redirects unauthenticated users to /login.
// Wrap protected pages with this component.

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Navigate } from "react-router-dom";
import { getCurrentUser } from "@/features/auth/api/authApi";
import { useAuthStore } from "@/stores/useAuthStore";

/**
 * AuthGuard Component
 * Wraps protected routes to ensure the user is authenticated.
 * Handles auto-fetching user data on page refresh if a token exists.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  // Extract state and actions from Zustand store
  const token = useAuthStore((s) => s.token);
  const currrentUser = useAuthStore((s) => s.currentUser);
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  // Condition to fetch user data
  const shouldFetchCurrentUser = Boolean(token && !currrentUser);

  // Fetch current user from API if token exists but user data is missing
  const {
    data: fetchedUser,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: getCurrentUser,
    enabled: shouldFetchCurrentUser, // Only run the query if this is true
    retry: false, // Fail immediately if token is expired/invalid
  });

  // Update Zustand store with fetched user data when available
  useEffect(() => {
    if (token && fetchedUser) {
      setAuth(token, fetchedUser);
    }
  }, [token, fetchedUser, setAuth]);

  // Clear local auth state if the API rejects the token
  useEffect(() => {
    if (isError) {
      clearAuth();
    }
  }, [isError, clearAuth]);

  // --- Rendering Logic ---
  // No token at all -> Kick back to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Still fetching user data -> Show spinner
  if (isLoading || shouldFetchCurrentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Fetch failed (invalid/expired token) -> Kick back to login
  if (isError) {
    return <Navigate to="/login" replace />;
  }

  // All checks passed -> Render the protected page
  return <>{children}</>;
}
