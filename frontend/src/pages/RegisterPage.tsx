// pages/RegisterPage.tsx — Registration form placeholder.
// TODO: Intern will implement.

import { Link } from 'react-router-dom';

export function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6 rounded-lg border p-8">
        <h1 className="text-2xl font-bold">Create Account</h1>
        <p className="text-sm text-muted-foreground">
          TODO: Build registration form. Call POST /api/auth/register.
        </p>
        <p className="text-sm">
          Already have an account?{' '}
          <Link to="/login" className="underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
