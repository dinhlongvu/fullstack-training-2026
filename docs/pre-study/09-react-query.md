# 09 — React Query (TanStack Query)

React Query is the de-facto library for managing **server state** in React apps. It handles fetching, caching, synchronizing, and updating data from APIs — replacing manual `useState` + `useEffect` patterns.

> **Prerequisite:** You should have read [08 — React Basics](08-react-basics.md). React Query replaces the manual `useEffect` + `fetch` pattern shown there.

---

## Why Not Just useEffect?

Manual data fetching with `useEffect` has these problems:

```tsx
// ❌ useEfffect — you manage EVERYTHING yourself
function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/users')
      .then(r => r.json())
      .then(setUsers)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);
  // No cache — fetches EVERY time you visit this page
  // No auto-refresh — stale data sits there forever
  // 3 components calling same API = 3 requests
}
```

React Query solves all of this out of the box.

---

## useQuery — Reading Data (GET)

```tsx
import { useQuery } from '@tanstack/react-query';

function UserList() {
  const { data: users, isLoading, error } = useQuery({
    queryKey: ['users'],                           // Cache key
    queryFn: () => fetch('/api/users')             // How to fetch
                  .then(r => r.json()),
    staleTime: 5 * 60 * 1000,                      // 5 min before refetch
  });

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error!</p>;

  return (
    <ul>
      {users?.map(u => <li key={u.id}>{u.name}</li>)}
    </ul>
  );
}
```

**What you get for free:**
- **Cache** — second visit = instant load (shows cached data, refetches in background)
- **Auto refetch** — when tab regains focus, after `staleTime` expires
- **Retry** — 3 automatic retries on failure (exponential backoff)
- **Deduplication** — 3 components with `['users']` = only 1 real request

---

## useMutation — Writing Data (POST/PUT/DELETE)

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';

function DeleteUserButton({ userId }: { userId: number }) {
  const queryClient = useQueryClient();

  const deleteUser = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/users/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      // Tell React Query: "['users'] cache is stale, refetch it!"
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  return (
    <button
      onClick={() => deleteUser.mutate(userId)}
      disabled={deleteUser.isPending}
    >
      {deleteUser.isPending ? 'Deleting...' : 'Delete'}
    </button>
  );
}
```

---

## Key Rules

| Rule | Why |
|------|-----|
| `queryKey` must be unique per data type | React Query uses it for caching — same key = same cache |
| Never call `useQuery` inside conditions/loops | Hooks must be called in the same order every render |
| Use `invalidateQueries` after mutations | Tells React Query "this data is stale, refetch it" |
| React Query ≠ client state | Use Zustand for UI state (theme, modals), React Query for server data |

---

## 📚 Further Reading

- [TanStack Query Docs](https://tanstack.com/query/latest)
- [TkDodo's Practical React Query (blog series)](https://tkdodo.eu/blog/practical-react-query)
- [React Query API Reference](https://tanstack.com/query/latest/docs/framework/react/reference/useQuery)
- [Why You Don't Need useEffect for Data Fetching](https://tkdodo.eu/blog/why-you-want-react-query)

---

> **Tip:** If something comes from an API, use React Query. If it lives only in the browser (theme, modal open/close), use Zustand. This simple rule will guide 90% of your state decisions.
