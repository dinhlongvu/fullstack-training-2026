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
  const currentUser = useAuthStore((s) => s.currentUser);
  const setAuth = useAuthStore((s) => s.setAuth);

  // Condition to fetch user data
  const shouldFetchCurrentUser = Boolean(token && !currentUser);

  // Fetch current user from API if token exists but user data is missing
  const {
    data: fetchedUser,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: getCurrentUser,
    enabled: shouldFetchCurrentUser,
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message === "Unauthorized") {
        return false;
      }

      return failureCount < 2;
    },
  });

  // Update Zustand store with fetched user data when available
  useEffect(() => {
    if (token && fetchedUser) {
      setAuth(token, fetchedUser);
    }
  }, [token, fetchedUser, setAuth]);

  // --- Rendering Logic ---
  // No token at all -> Kick back to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Fetch failed (invalid/expired token) -> Kick back to login
  if (isError) {
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

  // All checks passed -> Render the protected page
  return <>{children}</>;
}
