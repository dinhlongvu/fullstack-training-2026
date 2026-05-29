# 05 — React Basics

React is a JavaScript library for building user interfaces. It's component-based, declarative, and the most popular frontend library in 2026. This project uses React with TypeScript.

---

## 1. Components

A React app is built from **components** — small, reusable pieces of UI:

```tsx
// Functional component (modern approach — what we use)
function Greeting({ name }: { name: string }) {
    return <h1>Hello, {name}!</h1>;
}

// With TypeScript interface
interface UserCardProps {
    name: string;
    email: string;
    avatar?: string;  // optional prop
}

function UserCard({ name, email, avatar }: UserCardProps) {
    return (
        <div className="card">
            {avatar && <img src={avatar} alt={name} />}
            <h3>{name}</h3>
            <p>{email}</p>
        </div>
    );
}
```

---

## 2. Props vs State

| Concept | What | Mutable? | Example |
|---------|------|----------|---------|
| **Props** | Data passed from parent → child | ❌ Read-only | `<UserCard name="Alice" />` |
| **State** | Data managed inside the component | ✅ Yes | Form input, toggle, data from API |

```tsx
import { useState } from 'react';

function Counter() {
    // State: component's own mutable data
    const [count, setCount] = useState(0);  // initial value = 0

    return (
        <div>
            <p>Count: {count}</p>
            <button onClick={() => setCount(count + 1)}>+1</button>
            <button onClick={() => setCount(0)}>Reset</button>
        </div>
    );
}
```

---

## 3. Hooks

Hooks let you use state and other React features in functional components.

### useState — local state

```tsx
const [value, setValue] = useState<Type>(initialValue);
// value   → current state (read)
// setValue → function to update state (write)
```

### useEffect — side effects

```tsx
import { useState, useEffect } from 'react';

function UserList() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // This runs AFTER the component renders
        async function fetchUsers() {
            const response = await fetch('/api/users');
            const data = await response.json();
            setUsers(data);
            setLoading(false);
        }
        fetchUsers();
    }, []);  // Empty array = run once on mount

    if (loading) return <p>Loading...</p>;

    return (
        <ul>
            {users.map(user => (
                <li key={user.id}>{user.name}</li>
            ))}
        </ul>
    );
}
```

**Dependency array rules:**
- `[]` → runs **once** (on mount)
- `[count]` → runs when `count` changes
- No array → runs on **every render** (rarely used)

### Custom hooks — reuse logic

```tsx
// hooks/useUsers.ts
function useUsers() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/users')
            .then(res => res.json())
            .then(data => { setUsers(data); setLoading(false); });
    }, []);

    return { users, loading };
}

// Component using the custom hook
function UserList() {
    const { users, loading } = useUsers();
    // Clean and reusable!
}
```

---

## 4. Handling Events

```tsx
function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();  // Prevent page reload
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        // Handle response...
    };

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email"
            />
            <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password"
            />
            <button type="submit">Log In</button>
        </form>
    );
}
```

---

## 5. Conditional Rendering

```tsx
function UserProfile({ user }: { user: User | null }) {
    // Guard clause — early return
    if (!user) return <p>No user found.</p>;

    // Ternary
    return (
        <div>
            <h2>{user.name}</h2>
            {user.isAdmin ? <Badge>Admin</Badge> : null}

            {/* Logical AND — show only if truthy */}
            {user.bio && <p>{user.bio}</p>}
        </div>
    );
}
```

---

## 📚 Further Reading

- [React.dev — Official Tutorial](https://react.dev/learn)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [useEffect Guide](https://react.dev/reference/react/useEffect)
- [Kent C. Dodds Blog](https://kentcdodds.com/blog)

---

> **Tip:** The best way to learn React is to build. Create a `Counter`, then a `TodoList`, then a `UserSearch` component. Each one teaches a new concept.
