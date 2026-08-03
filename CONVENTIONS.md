# Coding Conventions

Project-wide conventions for the Fullstack Training 2026 program. All code, comments, and documentation must be written in **English**.

---

## General

| Rule | Standard |
|------|----------|
| Language | English (code, comments, commits, docs) |
| Line ending | LF (`\n`) |
| File encoding | UTF-8 |
| Trailing whitespace | None — strip on save |
| End of file | One blank line at end |

### Indentation — Language-Specific

| Language | Indent | Enforced by |
|----------|--------|------------|
| **C# (.NET)** | **Tabs** | `dotnet format` (Microsoft standard) |
| **TypeScript / JavaScript / TSX** | **2 spaces** | Prettier (industry standard) |
| **JSON / YAML / Markdown** | **2 spaces** | Prettier / EditorConfig |
| **SQL** | 4 spaces | Convention |

> **Rule:** Don't argue tabs vs spaces. Let the formatter decide. Run `dotnet format` for C#, `npx prettier --write` for frontend before every commit. CI will reject violations.

---

## Git

### Branch Naming

```
<label>/task-<XX>-<short-description>

Examples:
hoc/task-01-project-crud-api
bao/task-03-project-list-ui
phuc/test-cases-auth-api
```

### Commit Messages

```
type(scope): short description

Types: feat, fix, refactor, docs, style, test, chore

Examples:
feat(api): add POST /api/projects endpoint
fix(ui): resolve login button not responding on mobile
refactor(handler): extract validation into pipeline behavior
docs(readme): update architecture diagram
test(projects): add integration tests for project CRUD
```

### Pull Requests

Every PR must include:

- **Title**: concise summary of the change
- **Description**:
  - What this PR does
  - How to test (manual test steps)
  - Screenshot (if UI change)
- **Linked Issue**: `Closes #XX`

---

## Backend — C# (.NET 8 + Carter + MediatR + CQRS)

### Naming

| Element | Convention | Example |
|---------|-----------|---------|
| Carter Module | PascalCase + `Module` | `TasksModule`, `ProjectsModule` |
| Command record | PascalCase + `Command` | `CreateTaskCommand` |
| Query record | PascalCase + `Query` | `GetTasksQuery` |
| Handler class | PascalCase + `Handler` | `CreateTaskHandler` |
| Entity class | PascalCase (noun) | `TaskItem`, `Project` |
| DTO record | PascalCase + `Dto` | `TaskDto`, `TaskSummaryDto` |
| Validator class | PascalCase + `Validator` | `CreateTaskCommandValidator` |
| Mapping profile | PascalCase + `MappingProfile` | `TaskMappingProfile` |
| DbContext | PascalCase + `DbContext` | `AppDbContext` |
| Interface | `I` prefix + PascalCase | `IMediator` (from MediatR) |
| Private field | `_camelCase` | `_db`, `_mapper` |
| Local variable | camelCase | `taskId`, `projectName` |
| Async method | PascalCase + `Async` suffix | `Handle` (MediatR convention) |

### File Structure

```
backend/
├── Modules/                      # 1 file = 1 resource group (Carter)
├── Commands/<Resource>/          # 1 file = 1 command + handler
├── Queries/<Resource>/           # 1 file = 1 query + handler
├── Domain/                       # 1 file = 1 entity
├── DTOs/                         # 1 file = 1 DTO group
├── Infrastructure/Data/          # DbContext + Entity Configurations
├── Validation/                   # 1 validator per command/query
├── Mapping/                      # 1 profile per domain group
└── Middleware/                    # 1 middleware class per concern
```

### CQRS Conventions

```csharp
// ✅ Correct — Command + Handler in ONE file
public record CreateTaskCommand(...) : IRequest<TaskDto>;

public class CreateTaskHandler : IRequestHandler<CreateTaskCommand, TaskDto>
{
    private readonly AppDbContext _db;   // Inject DbContext directly (no repo wrapper)
    private readonly IMapper _mapper;

    public async Task<TaskDto> Handle(CreateTaskCommand cmd, CancellationToken ct)
    {
        // Validation runs automatically via ValidationBehavior pipeline
        var entity = _mapper.Map<TaskItem>(cmd);
        _db.Tasks.Add(entity);
        await _db.SaveChangesAsync(ct);
        return _mapper.Map<TaskDto>(entity);
    }
}

// ❌ Wrong — injecting a repository wrapper on top of EF Core
// EF Core's DbSet<T> IS the repository. Don't wrap it.
```

### API Conventions

- Use **Carter modules** with `MapGet`, `MapPost`, `MapPut`, `MapPatch`, `MapDelete`
- Delegate ALL business logic to MediatR — modules stay thin (HTTP only)
- Return `IResult` types: `Results.Ok()`, `Results.Created()`, `Results.NotFound()`, `Results.NoContent()`
- Use `MapGroup()` + `RequireAuthorization()` for protected routes
- Parameter binding: complex types from JSON body, primitives from route/query string

### HTTP Status Codes

| Code | When to Use |
|------|-----------|
| `200 OK` | Successful GET, PUT, PATCH |
| `201 Created` | Successful POST (include `Location` header) |
| `204 No Content` | Successful DELETE |
| `400 Bad Request` | Validation failed (thrown by FluentValidation pipeline) |
| `401 Unauthorized` | Missing or invalid JWT token |
| `404 Not Found` | Resource does not exist |
| `500 Internal Server Error` | Unexpected error (caught by ExceptionHandlingMiddleware) |

> Status 400 → body is always `{ "errors": [...], "traceId": "..." }`.
> All other error status (401 / 404 / 409 / 500) → body is always `{ "error": "...", "traceId": "..." }`.
> Query parameters: if a parameter is present in the URL (even as an empty string),
> its value must be valid; the server returns 400 instead of silently ignoring it.
> To skip filtering, omit the parameter entirely.

### Validation

- One `AbstractValidator<T>` per command/query
- Never call `ValidateAsync()` manually — the `ValidationBehavior` pipeline handles it
- Return meaningful `WithMessage("...")` strings (user-facing)

### AutoMapper

- Define mappings in `Profile` classes, not inline in handlers
- Use `.ProjectTo<T>()` for read queries (translates to SQL `SELECT` — faster)
- Use `_mapper.Map<T>()` for write operations

### EF Core

- Configure entities via Fluent API in `Configurations/` (not Data Annotations)
- Always use async: `ToListAsync()`, `FirstOrDefaultAsync()`, `SaveChangesAsync()`
- Watch for N+1 queries: use `.Include()` or `.ProjectTo<T>()`
- Connection strings in `appsettings.json` (or User Secrets for dev) — never hardcoded

---

## Frontend — React 18 + TypeScript

### Naming

| Element | Convention | Example |
|---------|-----------|---------|
| Component file | PascalCase `.tsx` | `KanbanBoard.tsx` |
| Page component | PascalCase + `Page` | `ProjectsPage.tsx` |
| Hook file | `use` + PascalCase `.ts` | `useUsers.ts` |
| Zustand store | `use` + PascalCase + `Store` | `useAuthStore.ts` |
| API function | camelCase `.ts` | `apiFetch.ts` |
| Type / Interface | PascalCase | `User`, `CreateTaskDto` |
| shadcn/ui components | `ui/` + PascalCase | `ui/Button.tsx` |
| Variable / Function | camelCase | `userList`, `handleDelete` |

### File Structure

```
frontend/src/
├── components/ui/               # shadcn/ui components (auto-generated)
├── features/<feature>/          # Feature-based modules
│   ├── components/              #   Feature-specific components
│   ├── hooks/                   #   Feature-specific hooks
│   └── api/                     #   React Query hooks (useQuery/useMutation)
├── stores/                      # Zustand stores
├── hooks/                       # Shared custom hooks
├── api/                         # Base API client (fetch wrapper + token injection)
├── lib/                         # Utilities, constants, shared types
└── App.tsx                      # Router + Layout
```

### Component Structure

```tsx
// 1. Imports (React → third-party → local)
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { type Task } from '@/lib/types';

// 2. Props interface
interface TaskCardProps {
  task: Task;
  onStatusChange: (id: number, status: string) => void;
}

// 3. Component
export function TaskCard({ task, onStatusChange }: TaskCardProps) {
  // Hooks at the top
  const [isOpen, setIsOpen] = useState(false);

  // Early return for edge cases
  if (!task) return null;

  // Main render
  return (
    <div className="rounded-lg border p-4">
      <h3>{task.title}</h3>
      {/* ... */}
    </div>
  );
}
```

### State Management

| Data Type | Use | Keep In |
|-----------|-----|---------|
| Data from API (users, tasks, projects) | **React Query** (`useQuery`, `useMutation`) | Cache handled automatically |
| UI state (auth token, theme, modal open) | **Zustand** (`useAuthStore`, `useUIStore`) | Client-side store |
| Local form state (input values) | **React Hook Form** (`useForm`) | Form instance |
| One-off local state (toggle, counter) | `useState` | Component |

> **Rule:** API data → React Query. Browser-only state → Zustand. Never mix them.

### Forms

```tsx
// 1. Define Zod schema FIRST
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// 2. Infer TypeScript type from schema (single source of truth)
type LoginForm = z.infer<typeof loginSchema>;

// 3. Use React Hook Form with zodResolver
const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
  resolver: zodResolver(loginSchema),
});
```

### Styling

- Use **Tailwind CSS** utility classes exclusively
- Use **shadcn/ui** components for common UI patterns (Button, Dialog, Table, Input)
- No CSS Modules, no inline styles, no separate `.css` files (except global reset)

### API Calls

- All API calls go through React Query hooks (not raw `fetch`/`axios` in components)
- Token injection handled by a shared `apiFetch()` wrapper in `lib/api.ts`
- Use `useQuery` for GET, `useMutation` for POST/PUT/PATCH/DELETE
- After mutations, call `queryClient.invalidateQueries()` to refresh stale data

---

## General Best Practices

1. **Single Responsibility** — each file/class/function does exactly one thing
2. **Early Return** — prefer early returns over nested `if` blocks
3. **Meaningful Names** — no single-letter variables except loop counters (`i`, `j`)
4. **No Dead Code** — delete unused code; don't comment it out
5. **Error Handling** — always handle errors; no empty `.catch()`
6. **TypeScript Strict** — avoid `any`; use proper types and interfaces
7. **No Magic Values** — use named constants, enums, or configuration

---

*When in doubt, ask your mentor. There are no stupid questions!*
