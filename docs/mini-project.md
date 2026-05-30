# Mini Project: TaskBoard — Simple Task Management

> **Duration:** 6 weeks (Week 3–8, right after pre-study)  
> **Team:** 2 Fullstack Devs + 1 QA  
> **Tech Stack:** .NET 8 (Carter + MediatR + EF Core) + React 18 (TypeScript) + SQLite + Docker (optional)  
> **Difficulty:** Beginner-Friendly 🟢

---

## 1. What Is TaskBoard?

A simple Kanban-style task board where team members can:

- 📋 Create projects and add members
- 📝 Create tasks and move them across columns (Todo → In Progress → Done)
- 💬 Comment on tasks
- 📊 See a basic dashboard with task stats

Think of it as "Trello, but simpler" — just enough to learn the full stack without getting overwhelmed.

---

## 2. Core Features

### 2.1 Authentication (Simple JWT)

- Register with email + password
- Login → get a JWT token
- Protected pages: redirect to login if not authenticated
- No roles yet — everyone is equal (add roles in stretch goals)

### 2.2 Project Management

- Create a project (name + description)
- See list of your projects
- Add other users to your project
- Edit/delete your own projects

### 2.3 Task Board (Kanban)

- 3 columns: **Todo** | **In Progress** | **Done**
- Create a task: title, description, priority (Low/Medium/High), due date (optional)
- Click to move task between columns
- Filter tasks by priority or assignee
- Assign task to a project member

### 2.4 Comments

- Add comment on any task
- See all comments on a task
- Simple — no edit/delete for now

### 2.5 Simple Dashboard

- "My Tasks" count by status
- Upcoming deadlines (due within 3 days)
- Project overview: total tasks, completed tasks

---

## 3. Database — Just 5 Tables

```
┌──────────┐     ┌────────────────┐     ┌──────────┐
│  Users   │────<│ ProjectMembers │>────│ Projects │
└──────────┘     └────────────────┘     └──────────┘
     │                                        │
     │         ┌──────────┐                   │
     ├────────<│  Tasks   │>──────────────────┘
     │         └──────────┘
     │               │
     │         ┌──────────┐
     └────────<│ Comments │
               └──────────┘
```

```sql
-- Users
Users: Id, Email, FullName, PasswordHash, CreatedAt

-- Projects  
Projects: Id, Name, Description, CreatedAt, CreatedById (FK → Users)

-- Project Members (who's in which project)
ProjectMembers: Id, ProjectId (FK), UserId (FK), JoinedAt

-- Tasks
Tasks: Id, ProjectId (FK), Title, Description, 
       Status (Todo|InProgress|Done), Priority (Low|Medium|High),
       AssigneeId (FK → Users, nullable), DueDate (nullable), CreatedAt

-- Comments
Comments: Id, TaskId (FK), AuthorId (FK → Users), Content, CreatedAt
```

---

## 4. API Endpoints (Carter + MediatR + CQRS)

### Auth
```
POST /api/auth/register     ← { email, fullName, password }
POST /api/auth/login        ← { email, password } → { token }
GET  /api/auth/me           ← Get current user info (requires token)
```

### Projects
```
GET    /api/projects                  ← My projects
POST   /api/projects                  ← Create { name, description }
GET    /api/projects/{id}             ← Project detail + members
PUT    /api/projects/{id}             ← Update (owner only)
DELETE /api/projects/{id}             ← Delete (owner only)
POST   /api/projects/{id}/members     ← Add member { userId }
```

### Tasks
```
GET    /api/projects/{id}/tasks                ← Tasks in project (?status=&priority=&assignee=)
POST   /api/projects/{id}/tasks                ← Create { title, description, priority, dueDate? }
GET    /api/tasks/{id}                         ← Task detail + comments
PUT    /api/tasks/{id}                         ← Update task
PATCH  /api/tasks/{id}/status                  ← Move: { status: "InProgress" }
PATCH  /api/tasks/{id}/assign                  ← Assign: { assigneeId: 3 }
DELETE /api/tasks/{id}                         ← Delete task
```

### Comments
```
GET    /api/tasks/{id}/comments      ← All comments for a task
POST   /api/tasks/{id}/comments      ← Add { content }
```

### Dashboard
```
GET    /api/dashboard/my-stats        ← My task counts by status, upcoming deadlines
```

**Total: 17 endpoints** — small enough to build in 4 weeks.

---

## 5. CQRS Pattern — But Kept Simple

We use MediatR for clean separation, but keep handlers simple:

```csharp
// Command — Create a task
public record CreateTaskCommand(int ProjectId, string Title, string Description, 
    Priority Priority, DateTime? DueDate) : IRequest<TaskDto>;

public class CreateTaskHandler : IRequestHandler<CreateTaskCommand, TaskDto>
{
    // 1. Validate input (FluentValidation)
    // 2. Create entity
    // 3. Save to DB (EF Core)
    // 4. Map to DTO (AutoMapper)
    // 5. Return DTO
}

// Query — Get tasks in a project
public record GetTasksQuery(int ProjectId, string? Status, string? Priority) 
    : IRequest<List<TaskDto>>;

public class GetTasksHandler : IRequestHandler<GetTasksQuery, List<TaskDto>>
{
    // 1. Query DB with filters (EF Core + LINQ)
    // 2. Map to DTOs (AutoMapper)
    // 3. Return list
}
```

**The key learning:** Commands change data, Queries read data. Separate handlers = clean, testable code.

---

## 6. Frontend — 6 Pages

```
/login          — Email + password form
/register       — Registration form
/projects       — List of my projects + "Create" button
/projects/:id   — Kanban board (3 columns) + "New Task" button
/tasks/:id      — Task detail + comments
/dashboard      — My stats (task counts, deadlines)
```

### State Management (Simple)

- **React Query (TanStack Query):** all server data — projects, tasks, comments
- **Zustand:** only auth token + current user (1 small store)

### Component Tree

```
App
├── AuthGuard (redirect to /login if no token)
│   ├── Layout (sidebar + header)
│   │   ├── ProjectsPage → ProjectCard[]
│   │   ├── ProjectDetailPage
│   │   │   ├── KanbanBoard
│   │   │   │   ├── Column (Todo)
│   │   │   │   │   └── TaskCard[]
│   │   │   │   ├── Column (InProgress)
│   │   │   │   └── Column (Done)
│   │   │   └── CreateTaskDialog
│   │   ├── TaskDetailPage
│   │   │   ├── TaskInfo
│   │   │   └── CommentList → CommentItem[]
│   │   └── DashboardPage → StatsCards
│   └── LoginPage / RegisterPage
```

---

## 7. Task Breakdown — Complementary

### Stream A — Học (Backend-Heavy)

| Week | What to Build | Skills |
|------|--------------|--------|
| 3 | **Project CRUD API** — Carter module + EF Core + MediatR commands/queries | Carter, EF Core, CQRS basics |
| 4 | **Task CRUD API** — commands, queries, status transitions, filtering | FluentValidation, AutoMapper, LINQ |
| 5 | **Task CRUD continued + Comments API** — complete task endpoints, nested comments | API design, nested resources |
| 6 | **Auth API** — JWT generation, validation, protected routes | JWT, middleware, auth policies |
| 7 | **Dashboard API + Integration** — stats endpoint, connect with frontend | Aggregation queries, CORS |
| 8 | **Polish + Bug Fixes** — code review, error handling, edge cases | Git workflow, debugging |

### Stream B — Bảo (Frontend-Heavy)

| Week | What to Build | Skills |
|------|--------------|--------|
| 3 | **Auth UI + Router** — Login, Register, Zustand store, protected routes | React Router, Zustand, forms |
| 4 | **Projects UI** — Project list, create dialog, member management | React Query (mutations), shadcn/ui |
| 5 | **Kanban Board (Part 1)** — 3-column layout, TaskCard component | Component design, props/state |
| 6 | **Kanban Board (Part 2)** — "New Task" form, status toggle, filtering | React Query (queries), forms |
| 7 | **Task Detail + Comments** — Task detail page, comment list, comment form | Nested routes, useParams |
| 8 | **Dashboard + Polish** — Stats cards, upcoming deadlines, UX polish | Data visualization, final polish |

### Stream C — Phúc (QA)

| Week | What to Do | Skills |
|------|-----------|--------|
| 3 | Write test cases from spec + practice Postman with public APIs | Test case design, Postman basics |
| 4 | Manual test Project CRUD; report bugs | Bug reporting, Postman |
| 5 | Manual test Task CRUD + comments; start Postman collection | API testing, collections |
| 6 | Test Auth flow + protected endpoints | Auth testing, token handling |
| 7 | Test full Kanban flow; complete Postman collection | Integration testing |
| 8 | Regression test, verify all bug fixes, final test report | Test summary, QA sign-off |

---

## 8. Infrastructure — Simple SQLite

The project uses **SQLite** — a file-based database. No Docker, no server setup needed.

```json
// backend/appsettings.Development.json
{
  "ConnectionStrings": {
    "Default": "Data Source=TaskBoard.db"
  }
}
```

That's it. Run `dotnet ef database update` once, and the database file is created. No Redis, no Elasticsearch, no Docker required.

> **Optional:** To use SQL Server instead (for production-like setup), see the commented-out services in `docker-compose.yml`.

---

## 9. Definition of Done (Per Task)

Every GitHub Issue must satisfy:

```markdown
- [ ] Code builds: `dotnet build` (backend) / `npm run build` (frontend)
- [ ] CI passes (lint + build on PR)
- [ ] At least 2 manual test cases documented in PR description
- [ ] API endpoint tested with Swagger or Postman (if backend)
- [ ] UI screenshot attached (if frontend)
- [ ] No hardcoded strings — use appsettings.json or .env
- [ ] Code follows CONVENTIONS.md
- [ ] PR reviewed and approved
```

---

## 10. Success Criteria

By end of Week 8, interns should have:

- ✅ A working TaskBoard app running locally (Docker + `dotnet run` + `npm run dev`)
- ✅ Can register, login, create projects, add tasks, comment
- ✅ Tasks move through Todo → In Progress → Done
- ✅ Dashboard shows real stats from the database
- ✅ 17 API endpoints documented in Swagger
- ✅ All CI checks green on GitHub
- ✅ QA has completed 1 full test cycle with documented results

---

## 11. Stretch Goals (Only If Time Permits)

- 🟡 **Roles:** Admin can delete any project, Member can only edit own tasks
- 🟡 **Task search:** Simple text search with EF Core `LIKE` query
- 🟡 **Dark mode:** Toggle with Tailwind dark class
- 🟡 **Drag-and-drop:** Move task cards between columns with mouse

---

## 12. What Interns Will Learn

| Skill | How |
|-------|-----|
| **Carter Minimal API** | Building all 17 endpoints |
| **MediatR + CQRS** | Commands & queries with separate handlers |
| **EF Core + SQLite** | Entities, migrations, LINQ queries, Include/ThenInclude |
| **JWT Authentication** | Token generation, validation, protected routes |
| **React + TypeScript** | Components, hooks, forms, routing |
| **React Query** | useQuery, useMutation, cache invalidation |
| **Zustand** | Simple client state (auth token) |
| **shadcn/ui + Tailwind** | Pre-built components, utility-first CSS |
| **Git + PR workflow** | Branching, committing, PR description, code review |
| **Testing mindset** | Writing test cases, manual testing, bug reporting |

---

> **Golden rule:** It's better to have a simple app that WORKS than a fancy app that's broken. Focus on completing the core flow first, then polish.
