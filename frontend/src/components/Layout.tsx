// components/Layout.tsx
// Main app shell: sidebar navigation + header + content area.

import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/useAuthStore";
import { PageErrorBoundary } from "@/components/ErrorBoundary";
import { cn } from "@/lib/utils";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "block rounded-md px-3 py-2 hover:bg-accent",
    isActive && "bg-accent font-medium",
  );

export function Layout() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const handleLogout = () => {
    queryClient.clear();
    clearAuth();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen">
      {/* First tab stop on every page: skips the sidebar. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:border focus:bg-background focus:px-4 focus:py-2 focus:ring-2 focus:ring-ring"
      >
        Skip to main content
      </a>

      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/40 p-4">
        <h1 className="mb-6 text-lg font-bold">TaskBoard</h1>
        {/* NavLink matches by URL prefix without `end`, so leaving it out
            marks Projects as the current page while on /projects/5. */}
        <nav className="space-y-1">
          <NavLink to="/projects" end className={navLinkClass}>
            Projects
          </NavLink>
          <NavLink to="/dashboard" end className={navLinkClass}>
            Dashboard
          </NavLink>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b px-6 py-3">
          <span className="text-sm text-muted-foreground">
            {currentUser ? `Hello, ${currentUser.fullName}` : "TaskBoard"}
          </span>
          <button
            onClick={handleLogout}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Sign Out
          </button>
        </header>
        {/* tabIndex={-1} so the skip link actually moves focus, not just scroll */}
        <main id="main-content" tabIndex={-1} className="flex-1 p-6">
          {/* Reset the boundary on route change */}
          <PageErrorBoundary key={location.pathname}>
            <Outlet />
          </PageErrorBoundary>
        </main>
      </div>
    </div>
  );
}
