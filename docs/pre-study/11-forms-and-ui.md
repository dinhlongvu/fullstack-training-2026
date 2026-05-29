# 11 — Forms, Validation & UI

Real apps need forms (login, registration, data entry) and look professional. These four libraries work together to keep your code clean and your UI polished.

> **Prerequisites:** [08 — React Basics](08-react-basics.md) (controlled components), [09 — React Query](09-react-query.md) (useMutation for form submission).

---

## React Hook Form — Forms Without the Boilerplate

Manual forms with `useState` require state for every field + onChange handlers + validation logic. React Hook Form handles all of this with minimal code:

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// 1. Define validation schema with Zod
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;  // Auto-generate TypeScript type

// 2. Use the schema in your form
function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginForm) => {
    // data is fully typed and validated!
    console.log(data.email, data.password);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} placeholder="Email" />
      {errors.email && <p className="error">{errors.email.message}</p>}

      <input {...register('password')} type="password" />
      {errors.password && <p className="error">{errors.password.message}</p>}

      <button type="submit">Login</button>
    </form>
  );
}
```

**What you get:** `register()` binds input → state. `errors` auto-populates from Zod. No manual `useState`, no `onChange`, no `if (email === '')` — Zod handles it all.

---

## Tailwind CSS — Utility-First Styling

Instead of writing CSS files, you apply classes directly in JSX:

```tsx
// Tailwind: every class does ONE thing
<button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
  Submit
</button>

// Equivalent CSS: 5 separate rules in a .css file
// .btn { background: #3b82f6; color: white; padding: 8px 16px;
//        border-radius: 8px; }
// .btn:hover { background: #2563eb; }
```

Common utility classes:

| Class | What it does |
|-------|-------------|
| `bg-blue-500` | Blue background |
| `text-white`, `text-lg` | Text color, size |
| `px-4`, `py-2` | Horizontal/vertical padding |
| `rounded-lg` | Rounded corners |
| `flex`, `grid` | Layout |
| `hover:bg-blue-600` | Hover state |
| `md:flex-col` | Responsive (changes at `md` breakpoint) |

---

## shadcn/ui — Pre-Built Components on Top of Tailwind

shadcn/ui gives you copy-paste components (not a package to install). It generates code into your project that you fully own and customize:

```bash
# Add a component — it copies source into your project
npx shadcn-ui@latest add button
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add table
```

```tsx
// Use like any other component
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function SignUpForm() {
  return (
    <div className="space-y-4">
      <Input placeholder="Email" />
      <Input placeholder="Password" type="password" />
      <Button variant="default">Sign Up</Button>
    </div>
  );
}
```

**Why not a normal npm package?** You own the code — customize anything without waiting for upstream changes.

---

## The Full Picture

```
┌────────────────────────────────────────┐
│              YOUR FORM                  │
│                                         │
│  React Hook Form  ← manages form state │
│  Zod              ← validates input    │
│  Tailwind CSS     ← styles everything  │
│  shadcn/ui        ← pre-built UI parts │
│  React Query      ← submits to API     │
└────────────────────────────────────────┘
```

---

## 📚 Further Reading

- [React Hook Form Docs](https://react-hook-form.com/get-started)
- [Zod Documentation](https://zod.dev)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/docs/components)
- [Tailwind Cheat Sheet](https://nerdcave.com/tailwind-cheat-sheet)

---

> **Tip:** When building a form: define your Zod schema FIRST, then build the UI around it. The schema becomes your single source of truth — TypeScript types, validation rules, and form structure all derive from it.
