// components/AuthGuard.tsx
// Redirects unauthenticated users to /login.
// Wrap protected pages with this component.

import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
