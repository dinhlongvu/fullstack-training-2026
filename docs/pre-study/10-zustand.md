# 10 — Zustand (Client State Management)

Zustand (German for "state") is a tiny, fast state management library for React. It manages **client state** — data that lives only in the browser: logged-in user, theme, open/closed modals, UI filters.

> **Prerequisite:** [09 — React Query](09-react-query.md). Zustand handles what React Query doesn't: UI state that never comes from an API.

---

## The Problem: Prop Drilling

Without state management, sharing data between distant components requires passing props through every level:

```tsx
// ❌ Prop drilling — data passes through components that don't need it
App → Dashboard (receives user, passes it down)
    → Navbar (receives user, passes it down)
        → UserMenu (FINALLY uses user)
```

Every middle component is forced to accept and forward props it doesn't use.

---

## The Solution: A Shared Store

```tsx
// stores/useAuthStore.ts
import { create } from 'zustand';

interface AuthState {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  login: (user, token) => set({ user, token }),
  logout: () => set({ user: null, token: null }),
}));
```

**Any component can read or write — no props needed:**

```tsx
// Component A — anywhere in the tree, reads user
function Navbar() {
  const user = useAuthStore((state) => state.user);
  return <span>Hello, {user?.name ?? 'Guest'}</span>;
}

// Component B — completely unrelated, writes to store
function LoginButton() {
  const login = useAuthStore((state) => state.login);
  return <button onClick={() => login(userData, token)}>Login</button>;
}

// Component C — subscribes to logout action
function SettingsMenu() {
  const logout = useAuthStore((state) => state.logout);
  return <button onClick={logout}>Sign Out</button>;
}
```

A, B, and C share data through the store — with zero props passed between them.

---

## Selectors — Subscribe to What You Need

```tsx
// ✅ Good: component only re-renders when 'user' changes
const user = useAuthStore((state) => state.user);

// ❌ Bad: re-renders on ANY change in the store
const { user, token, login, logout } = useAuthStore();
```

Always use selectors to avoid unnecessary re-renders.

---

## Zustand vs React Query

| | Zustand | React Query |
|---|---|---|
| **Manages** | Client state | Server state |
| **Data source** | Browser (user actions) | Server (API responses) |
| **Examples** | User session, theme, modal, filters | User list, orders, posts |
| **Cache?** | No | Yes (automatic) |
| **Persistence?** | Manual (or middleware) | Built-in |

**Rule of thumb:** API data → React Query. UI state → Zustand.

---

## 📚 Further Reading

- [Zustand Documentation](https://docs.pmnd.rs/zustand)
- [Zustand GitHub (examples)](https://github.com/pmndrs/zustand)
- [Why Zustand Over Redux?](https://tkdodo.eu/blog/zustand-and-react-context)
- [Zustand vs Context API](https://docs.pmnd.rs/zustand/getting-started/comparison)

---

> **Tip:** Zustand stores are just functions — you can call `useAuthStore.getState()` outside React (e.g., in axios interceptors to attach tokens). This is a superpower Context API doesn't have!
