# Mini Project: TaskBoard — Simple Task Management

> **Duration:** 4 weeks (Week 2–5, right after pre-study)  
> **Team:** 2 Fullstack Devs + 1 QA  
> **Tech Stack:** .NET 8 (Carter + MediatR + EF Core) + React 18 (TypeScript) + SQL Server + Docker  
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
| 2 | **Project CRUD API** — Carter module + EF Core + MediatR commands/queries | Carter, EF Core, CQRS basics |
| 3 | **Task CRUD API** — commands, queries, status transitions, filtering | FluentValidation, AutoMapper, LINQ |
| 4 | **Comments + Auth API** — JWT generation, comment endpoints, authorization | JWT, middleware, auth policies |
| 5 | **Integration + Polish** — connect frontend, fix bugs, code review | Git workflow, debugging |

### Stream B — Bảo (Frontend-Heavy)

| Week | What to Build | Skills |
|------|--------------|--------|
| 2 | **Auth UI + Router** — Login, Register, Zustand store, protected routes | React Router, Zustand, forms |
| 3 | **Projects UI** — Project list, create dialog, member management | React Query (mutations), shadcn/ui |
| 4 | **Kanban Board** — 3 columns, TaskCard, "New Task" form, status toggle | React Query (queries), component design |
| 5 | **Dashboard + Polish** — Stats cards, upcoming deadlines, connect real API | Data visualization, UX polish |

### Stream C — Phúc (QA)

| Week | What to Do | Skills |
|------|-----------|--------|
| 2 | Write test cases for Auth + Project APIs (8-10 cases) | Test case design |
| 3 | Manual test Project CRUD + Task CRUD; report bugs | Bug reporting, Postman |
| 4 | Test full Kanban flow + comments; create Postman collection | API testing, collections |
| 5 | Regression test, verify all bug fixes, final test report | Test summary, automation intro |

---

## 8. Infrastructure — Simple Docker

```yaml
# docker-compose.yml — just ONE service!
services:
  sqlserver:
    image: mcr.microsoft.com/mssql/server:2022-latest
    environment:
      SA_PASSWORD: "YourStrong!Passw0rd"
      ACCEPT_EULA: "Y"
    ports:
      - "1433:1433"
    volumes:
      - sqldata:/var/opt/mssql

volumes:
  sqldata:
```

That's it. No Redis, no Elasticsearch, no Kibana. One command: `docker compose up -d`.

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

By end of Week 5, interns should have:

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
| **EF Core + SQL Server** | Entities, migrations, LINQ queries, Include/ThenInclude |
| **JWT Authentication** | Token generation, validation, protected routes |
| **React + TypeScript** | Components, hooks, forms, routing |
| **React Query** | useQuery, useMutation, cache invalidation |
| **Zustand** | Simple client state (auth token) |
| **shadcn/ui + Tailwind** | Pre-built components, utility-first CSS |
| **Docker** | Running SQL Server in a container |
| **Git + PR workflow** | Branching, committing, PR description, code review |
| **Testing mindset** | Writing test cases, manual testing, bug reporting |

---

> **Golden rule:** It's better to have a simple app that WORKS than a fancy app that's broken. Focus on completing the core flow first, then polish.
