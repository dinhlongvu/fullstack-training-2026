// pages/LoginPage.tsx — Login form placeholder.
// TODO: Intern will implement React Hook Form + Zod + API call.

import { Link } from 'react-router-dom';

export function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6 rounded-lg border p-8">
        <h1 className="text-2xl font-bold">Sign In</h1>
        <p className="text-sm text-muted-foreground">
          TODO: Build this form with React Hook Form + Zod.
          <br />
          Call POST /api/auth/login, store token in Zustand.
        </p>
        <p className="text-sm">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
