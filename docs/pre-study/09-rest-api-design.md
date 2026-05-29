# 09 — REST API Design

## Concept

REST (Representational State Transfer) is an architectural style for designing APIs. It uses standard HTTP methods to perform operations on **resources** (nouns), identified by URLs.

A well-designed REST API is **predictable** — you can guess endpoints without reading docs.

## Resource-Oriented Design

```
Resource (noun)     →    HTTP Method (verb)
────────────────────────────────────────────
GET    /api/tasks          → List all tasks
GET    /api/tasks/42       → Get task #42
POST   /api/tasks          → Create a new task
PUT    /api/tasks/42       → Replace task #42 entirely
PATCH  /api/tasks/42       → Partial update task #42
DELETE /api/tasks/42       → Delete task #42
```

### Nested Resources

```
GET  /api/projects/7/tasks          → Tasks in project #7
POST /api/projects/7/tasks          → Create task in project #7
GET  /api/tasks/42/comments         → Comments on task #42
POST /api/tasks/42/comments         → Add comment to task #42
```

### Actions That Aren't CRUD

Some operations don't map cleanly to CRUD. Use descriptive sub-resources:

```
PATCH /api/tasks/42/status          → Change task status
PATCH /api/tasks/42/assign          → Assign task to user
POST  /api/tasks/42/archive         → Archive a task
```

## HTTP Methods Cheat Sheet

| Method | Safe? | Idempotent? | Use For |
|--------|:-----:|:-----------:|---------|
| GET | ✅ | ✅ | Reading data (never changes state) |
| POST | ❌ | ❌ | Creating new resources |
| PUT | ❌ | ✅ | Full replacement of a resource |
| PATCH | ❌ | ❌ | Partial update |
| DELETE | ❌ | ✅ | Removing a resource |

> **Safe** = doesn't modify data. **Idempotent** = calling it N times has the same effect as calling it once.

## HTTP Status Codes

```
2xx Success
  200 OK            — Request succeeded
  201 Created       — Resource created (return the new resource)
  204 No Content    — Success, nothing to return (DELETE)

3xx Redirection
  304 Not Modified  — Use cached version

4xx Client Error
  400 Bad Request   — Invalid input (validation failed)
  401 Unauthorized  — Not logged in
  403 Forbidden     — Logged in but no permission
  404 Not Found     — Resource doesn't exist
  409 Conflict      — Duplicate or state conflict
  422 Unprocessable — Validation errors (often used instead of 400)

5xx Server Error
  500 Internal Error — Something broke on the server
  503 Unavailable   — Server overloaded / maintenance
```

## API Response Conventions

### Success Response

```json
{
  "data": {
    "id": 42,
    "title": "Fix login bug",
    "status": "in-progress"
  },
  "success": true
}
```

### Collection (Paginated)

```json
{
  "data": [
    { "id": 1, "title": "Task 1" },
    { "id": 2, "title": "Task 2" }
  ],
  "success": true,
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 142,
    "totalPages": 8
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "title", "message": "Title is required" },
    { "field": "dueDate", "message": "Due date must be in the future" }
  ]
}
```

## Key Rules

- 🟢 **Use plural nouns for collection endpoints**: `/api/tasks`, not `/api/task`
- 🟢 **Use kebab-case in URLs**: `/api/project-members`, not `/api/projectMembers`
- 🟢 **Version your API from day 1**: `/api/v1/tasks` or via header
- 🟢 **Return proper HTTP status codes** — don't return 200 with error message
- 🟢 **Include pagination** for all list endpoints — never return ALL records
- 🟡 **Filtering, sorting, searching via query params**: `?status=open&sort=-createdAt&q=login`
- 🔴 **Never expose database IDs in public APIs without considering security**

## Common Pitfalls

| ❌ | ✅ |
|----|-----|
| `GET /api/createTask` (verb in URL) | `POST /api/tasks` |
| `POST /api/tasks/42` (update with POST) | `PUT /api/tasks/42` or `PATCH` |
| Return 200 with `{ "error": "..." }` | Return appropriate 4xx/5xx |
| Return ALL 10,000 records | Paginate with `?page=1&pageSize=20` |
| `GET /api/getUserById?id=5` | `GET /api/users/5` |

## 📚 Further Reading

- [REST API Tutorial](https://restfulapi.net/) — comprehensive guide
- [Microsoft REST API Guidelines](https://github.com/microsoft/api-guidelines) — industry standard
- [HTTP Status Codes](https://httpstatuses.com/) — every code explained
- [JSON:API](https://jsonapi.org/) — standardized API response format

## 💡 Tip

> A good API feels like a well-organized filing cabinet. You know where everything goes without being told — `GET /api/projects/7/tasks?status=open` tells a complete story in one URL.
