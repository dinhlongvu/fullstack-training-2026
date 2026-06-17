// components/Layout.tsx
// Main app shell: sidebar navigation + header + content area.

import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";

export function Layout() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/40 p-4">
        <h1 className="mb-6 text-lg font-bold">TaskBoard</h1>
        <nav className="space-y-1">
          <Link
            to="/projects"
            className="block rounded-md px-3 py-2 hover:bg-accent"
          >
            Projects
          </Link>
          <Link
            to="/dashboard"
            className="block rounded-md px-3 py-2 hover:bg-accent"
          >
            Dashboard
          </Link>
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
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
