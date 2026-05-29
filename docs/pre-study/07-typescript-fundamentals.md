# 07 — TypeScript Fundamentals

## Concept

TypeScript is JavaScript with **type safety**. It catches bugs at compile time instead of runtime. All React code in this project is written in TypeScript.

Think of types as "contracts" — they define what shape data must have.

## Code Examples

### Basic Types

```typescript
// Primitives
let name: string = "Alice";
let age: number = 25;
let isActive: boolean = true;

// Arrays
let tags: string[] = ["bug", "frontend"];
let scores: number[] = [95, 87, 91];

// Objects (interfaces)
interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "member";  // Union type — only these values allowed
}

const user: User = {
  id: 1,
  name: "Alice",
  email: "alice@example.com",
  role: "member",
};
```

### Functions with Types

```typescript
// Parameter & return types
function add(a: number, b: number): number {
  return a + b;
}

// Optional parameters
function greet(name: string, title?: string): string {
  return title ? `${title} ${name}` : name;
}

// Async functions return Promise<T>
async function fetchUser(id: number): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}
```

### Generics — Reusable Types

```typescript
// A generic API response wrapper
interface ApiResponse<T> {
  data: T;
  success: boolean;
  message: string;
}

// Usage: T becomes User, Task, etc.
type UserResponse = ApiResponse<User>;
type TaskListResponse = ApiResponse<Task[]>;

// Generic function
function getFirst<T>(items: T[]): T | undefined {
  return items[0];
}
```

### TypeScript with React

```tsx
// Props typing
interface TaskCardProps {
  title: string;
  status: "todo" | "in-progress" | "done";
  assignee?: User;      // Optional prop
  onStatusChange: (newStatus: string) => void;  // Callback type
}

function TaskCard({ title, status, assignee, onStatusChange }: TaskCardProps) {
  return (
    <div>
      <h3>{title}</h3>
      <span>{status}</span>
      {assignee && <span>Assigned to: {assignee.name}</span>}
    </div>
  );
}
```

## Key Rules

- 🟢 **Always define types for function parameters and return values**
- 🟢 **Use `interface` for object shapes, `type` for unions & aliases**
- 🟡 **Avoid `any`** — it defeats the purpose of TypeScript. Use `unknown` if you must
- 🟡 **Enable `strict: true` in `tsconfig.json`** for maximum safety
- 🔴 **Don't ignore TypeScript errors** — they're real bugs waiting to happen

## Common Pitfalls

| ❌ | ✅ |
|----|-----|
| `const data: any = response.json()` | `const data: User = await response.json()` |
| `function handle(data)` — no types | `function handle(data: Task): void` |
| Using `any` to silence errors | Fix the actual type mismatch |

## 📚 Further Reading

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html) — official guide
- [React + TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/) — practical patterns
- [TypeScript Playground](https://www.typescriptlang.org/play) — test code in browser
- [Total TypeScript](https://www.totaltypescript.com/) — free beginner tutorials

## 💡 Tip

> TypeScript errors are your friends — each one is a potential runtime bug caught early. Read them carefully, they tell you exactly what's wrong.
