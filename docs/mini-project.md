# Mini Project: TeamCollab — Team Collaboration Platform

> **Duration:** 4 weeks (Week 5–8)  
> **Team:** 2 Fullstack Devs + 1 QA  
> **Tech Stack:** .NET 8 + React 18 (TypeScript) + Docker + Azure

---

## 1. Project Overview

TeamCollab is an internal team collaboration and task management platform. It allows teams to create projects, manage tasks on a Kanban board, assign members, track progress via dashboards, and receive notifications.

### Why This Project

This mini project is designed to touch **every technology** in the training curriculum:

| Tech | Where It's Used |
|------|-----------------|
| .NET 8 + Carter | REST API endpoints (minimal API) |
| MediatR + CQRS | Separating commands & queries |
| EF Core + SQL Server | Data persistence, migrations |
| FluentValidation | Request validation |
| AutoMapper | DTO ↔ Entity mapping |
| IdentityServer + JWT | Authentication & role-based authorization |
| Serilog | Structured logging → Elasticsearch sink |
| xUnit | Unit + integration tests |
| React 18 + TypeScript + Vite | SPA frontend |
| React Query (TanStack Query) | Server state management |
| Zustand | Client state (auth, UI, filters) |
| React Router v6 | Client-side routing |
| React Hook Form + Zod | Form management & validation |
| shadcn/ui + Tailwind CSS | UI components |
| Axios | HTTP client with interceptors |
| Redis | Response caching |
| Hangfire | Background job processing (notifications) |
| Elasticsearch + Kibana | Log aggregation + task search/read-model |
| Docker Compose | Local dev infrastructure |
| Azure App Service | Cloud deployment |

---

## 2. Core Features

### 2.1 Authentication & Authorization

- User registration & login (JWT access token + refresh token)
- Role-based access control: **Admin**, **Project Manager**, **Member**
- Protected routes on both frontend (React Router guards) and backend (Authorization policies)
- Token refresh mechanism via Axios interceptors

### 2.2 Project Management

- **CRUD for projects**: name, description, status (Active/Archived)
- **Member management**: add/remove members, assign roles per project
- Each user sees only projects they belong to
- Project dashboard: task count by status, member workload overview

### 2.3 Task Management (CQRS)

- **CRUD for tasks** with Commands (create, update, delete, assign) and Queries (list, filter, search)
- **Task properties**: title, description, status, priority, assignee, due date, tags
- **Status workflow**: Backlog → To Do → In Progress → In Review → Done
- **Kanban board view**: drag-and-drop (or click-to-move) between status columns
- **List view**: sortable/filterable table
- **Task detail page**: full info, comments, activity history
- **Search**: full-text search via Elasticsearch read-model (synced from SQL Server)

### 2.4 Comments & Activity Log

- **Comments**: add/edit/delete on tasks (soft delete)
- **Activity log**: auto-recorded events — task created, status changed, assignee changed, comment added
- Displayed on task detail page as a timeline

### 2.5 Notifications (Background Jobs)

- **Email notifications** (simulated via Hangfire job logging in dev):
  - Task assigned to you
  - Task status changed
  - New comment on your task
- **In-app notification bell** (polled from API, cached in Redis)
- Hangfire dashboard for monitoring job execution

### 2.6 Dashboard & Analytics

- **Personal dashboard**: my tasks by status, upcoming deadlines, recent activity
- **Project dashboard**: burndown-like stats, tasks created vs completed per week
- **Cached with Redis** (TTL: 5 minutes) to demonstrate caching patterns

---

## 3. Architecture

```
┌──────────────────────────────────────────────────────┐
│                    Frontend (React)                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐  │
│  │ Zustand  │ │React Query│ │ shadcn/ui + Tailwind │  │
│  │(auth/UI) │ │ (server)  │ │  + Hook Form + Zod   │  │
│  └──────────┘ └──────────┘ └──────────────────────┘  │
│                        │                               │
│                   Axios + HTTPS                        │
└────────────────────────┼──────────────────────────────┘
                         │
┌────────────────────────┼──────────────────────────────┐
│                 Backend (.NET 8)                        │
│  ┌─────────────────────┼───────────────────────────┐  │
│  │              Carter (Minimal API)                 │  │
│  │  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │  │
│  │  │ Commands │  │  Queries  │  │  Validators   │  │  │
│  │  │(MediatR) │  │ (MediatR) │  │(FluentVali.)  │  │  │
│  │  └────┬─────┘  └────┬─────┘  └───────────────┘  │  │
│  │       │              │                            │  │
│  │  ┌────┴──────────────┴────┐  ┌────────────────┐  │  │
│  │  │    Application Layer   │  │  IdentityServer │  │  │
│  │  │  (Handlers + Services) │  │    + JWT Auth   │  │  │
│  │  └───────────┬────────────┘  └────────────────┘  │  │
│  │              │                                     │  │
│  │  ┌───────────┴────────────┐                       │  │
│  │  │   Domain Layer         │                       │  │
│  │  │  (Entities + VOs)      │                       │  │
│  │  └───────────┬────────────┘                       │  │
│  │              │                                     │  │
│  │  ┌───────────┴────────────┐                       │  │
│  │  │  Infrastructure        │                       │  │
│  │  │  EF Core + Repositories│                       │  │
│  │  └────────────────────────┘                       │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌─────────────┐  │
│  │ Hangfire│ │  Redis  │ │Serilog→ES│ │   xUnit     │  │
│  │ (Jobs)  │ │ (Cache) │ │  + Kibana│ │  (Tests)    │  │
│  └─────────┘ └─────────┘ └──────────┘ └─────────────┘  │
└──────────────────────────────────────────────────────────┘
                         │
┌────────────────────────┼──────────────────────────────┐
│            Infrastructure (Docker)                      │
│  ┌──────────┐ ┌──────────┐ ┌───────────────┐          │
│  │SQL Server│ │  Redis   │ │Elasticsearch  │          │
│  │  (1433)  │ │ (6379)   │ │  + Kibana     │          │
│  └──────────┘ └──────────┘ └───────────────┘          │
└──────────────────────────────────────────────────────────┘
```

---

## 4. Database Schema

### 4.1 Tables

```sql
-- Users (extends Identity)
Users: Id, Email, FullName, AvatarUrl, CreatedAt

-- Projects
Projects: Id, Name, Description, Status, CreatedAt, CreatedById

-- Project Members
ProjectMembers: Id, ProjectId, UserId, Role (Admin|Manager|Member), JoinedAt

-- Tasks
Tasks: Id, ProjectId, Title, Description, Status, Priority, 
       AssigneeId, DueDate, CreatedById, CreatedAt, UpdatedAt

-- Tags
Tags: Id, Name, Color
TaskTags: TaskId, TagId

-- Comments
Comments: Id, TaskId, AuthorId, Content, CreatedAt, UpdatedAt, IsDeleted

-- ActivityLog
ActivityLogs: Id, TaskId, UserId, Action, OldValue, NewValue, CreatedAt

-- Notifications
Notifications: Id, UserId, Message, Type, ReferenceId, IsRead, CreatedAt
```

### 4.2 Entity Relationships

```
User ───< ProjectMember >─── Project
User ───< Task (Assignee)
User ───< Task (Creator)
User ───< Comment
User ───< ActivityLog
User ───< Notification
Project ───< Task
Task ───< Comment
Task ───< ActivityLog
Task ───< TaskTag >─── Tag
```

---

## 5. API Design

### 5.1 Endpoints

```
Auth:
  POST   /api/auth/register
  POST   /api/auth/login
  POST   /api/auth/refresh
  GET    /api/auth/me

Projects:
  GET    /api/projects                    # List my projects
  POST   /api/projects                    # Create project
  GET    /api/projects/{id}               # Get project detail
  PUT    /api/projects/{id}               # Update project
  DELETE /api/projects/{id}               # Archive project
  GET    /api/projects/{id}/members       # List members
  POST   /api/projects/{id}/members       # Add member
  DELETE /api/projects/{id}/members/{uid} # Remove member

Tasks:
  GET    /api/projects/{id}/tasks         # List tasks (with filters)
  POST   /api/projects/{id}/tasks         # Create task
  GET    /api/tasks/{id}                  # Get task detail
  PUT    /api/tasks/{id}                  # Update task
  DELETE /api/tasks/{id}                  # Delete task
  PATCH  /api/tasks/{id}/status           # Change status
  PATCH  /api/tasks/{id}/assign           # Assign task
  GET    /api/tasks/search?q=...          # Full-text search (ES)

Comments:
  GET    /api/tasks/{id}/comments         # List comments
  POST   /api/tasks/{id}/comments         # Add comment
  PUT    /api/comments/{id}               # Edit comment
  DELETE /api/comments/{id}               # Soft delete

Dashboard:
  GET    /api/dashboard/personal          # My stats (cached)
  GET    /api/dashboard/projects/{id}     # Project stats (cached)

Notifications:
  GET    /api/notifications               # My notifications
  PATCH  /api/notifications/{id}/read     # Mark as read
```

### 5.2 CQRS Pattern Example

```
// Command
POST /api/projects/{id}/tasks
→ CreateTaskCommand { ProjectId, Title, Description, Priority }
→ CreateTaskCommandHandler
  → Validate (FluentValidation)
  → Map to Task entity (AutoMapper)
  → Save (EF Core)
  → Log activity
  → Enqueue notification job (Hangfire)
  → Return TaskDto

// Query
GET /api/projects/{id}/tasks?status=InProgress&assignee=me
→ GetTasksQuery { ProjectId, Status, AssigneeId }
→ GetTasksQueryHandler
  → Check Redis cache
  → If miss: Query DB with EF Core (filtered + paginated)
  → Cache result in Redis (TTL 2 min)
  → Return List<TaskDto>
```

---

## 6. Frontend Structure

```
frontend/src/
├── api/                    # Axios instance + API client functions
│   ├── client.ts           # Axios with interceptors (token refresh)
│   ├── auth.ts
│   ├── projects.ts
│   ├── tasks.ts
│   └── comments.ts
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── layout/             # AppShell, Sidebar, Header
│   ├── auth/               # LoginForm, RegisterForm
│   ├── projects/           # ProjectCard, ProjectList, MemberList
│   ├── tasks/              # TaskCard, KanbanBoard, TaskTable, TaskDetail
│   ├── comments/           # CommentList, CommentForm
│   ├── dashboard/          # StatsCards, BurndownChart
│   └── notifications/      # NotificationBell, NotificationList
├── hooks/                  # Custom hooks
│   ├── useAuth.ts
│   ├── useProjects.ts
│   ├── useTasks.ts
│   └── useNotifications.ts
├── stores/                 # Zustand stores
│   ├── authStore.ts
│   └── uiStore.ts
├── pages/                  # Route pages
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── DashboardPage.tsx
│   ├── ProjectsPage.tsx
│   ├── ProjectDetailPage.tsx
│   ├── KanbanBoardPage.tsx
│   └── TaskDetailPage.tsx
├── lib/                    # Utilities
│   └── utils.ts
├── types/                  # TypeScript types
│   └── index.ts
├── App.tsx                 # Router setup
└── main.tsx                # Entry point
```

---

## 7. Task Breakdown Strategy (Complementary)

### Stream A — Intern Học: Backend-Heavy Features

| Week | Task | Backend | Frontend |
|------|------|---------|----------|
| 5 | Task CRUD API (CQRS) | Commands, Queries, Validators, EF Core | — |
| 6 | Project Management API | Project CRUD, Members | — |
| 7 | Kanban Board UI | Status change endpoint | KanbanBoard, TaskCard, Drag-drop |
| 8 | Search & Dashboard | Elasticsearch sync, Dashboard queries | SearchBar, StatsCards |

### Stream B — Intern Bảo: Frontend-Heavy Features

| Week | Task | Backend | Frontend |
|------|------|---------|----------|
| 5 | Auth System | IdentityServer config, JWT | Login/Register pages, Auth store |
| 6 | Comments & Activity | Comments CRUD, ActivityLog | CommentList, CommentForm, Timeline |
| 7 | Task List + Detail UI | — | TaskTable, TaskDetail, Filters |
| 8 | Notifications + Polish | Hangfire jobs, Notification API | NotificationBell, Polish UI |

### Stream C — Intern Phúc: QA

| Week | Task |
|------|------|
| 5 | Write test cases for Auth + User API |
| 6 | Manual test Project CRUD + Member management |
| 7 | Manual test Task workflow + Kanban board |
| 8 | Full test cycle: regression, bug reports, API testing with Postman |

---

## 8. Infrastructure (Docker Compose)

```yaml
# docker-compose.yml
services:
  sqlserver:
    image: mcr.microsoft.com/mssql/server:2022-latest
    environment:
      SA_PASSWORD: "YourStrong!Passw0rd"
      ACCEPT_EULA: "Y"
    ports: ["1433:1433"]
    volumes: [sqlserver_data:/var/opt/mssql]

  elasticsearch:
    image: elasticsearch:8.12.0
    environment:
      discovery.type: single-node
      xpack.security.enabled: false
    ports: ["9200:9200"]
    volumes: [es_data:/usr/share/elasticsearch/data]

  kibana:
    image: kibana:8.12.0
    ports: ["5601:5601"]
    environment:
      ELASTICSEARCH_HOSTS: http://elasticsearch:9200

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

volumes:
  sqlserver_data:
  es_data:
```

---

## 9. Definition of Done (Per Task)

Every task issue must satisfy:

```markdown
- [ ] Code compiles: `dotnet build` (backend) / `npm run build` (frontend)
- [ ] CI pipeline passes (lint + build)
- [ ] Unit tests written for new logic (backend: xUnit, frontend: Vitest)
- [ ] At least 2 manual test cases documented in PR description
- [ ] No hardcoded secrets or connection strings
- [ ] API endpoints documented with Swagger (if backend)
- [ ] UI screenshots attached (if frontend)
- [ ] Code follows CONVENTIONS.md
- [ ] PR reviewed and approved by CEO
- [ ] No unresolved review comments
```

---

## 10. Success Criteria

By end of Week 8, the team should have:

- ✅ A fully functional TeamCollab app deployed to Azure
- ✅ Users can register, login, and manage projects
- ✅ Tasks move through the full Kanban workflow
- ✅ Search works via Elasticsearch
- ✅ Notifications fire via Hangfire background jobs
- ✅ Dashboard shows real-time stats (cached in Redis)
- ✅ All APIs have Swagger documentation
- ✅ Backend test coverage ≥ 60%
- ✅ QA has executed full test cycle with documented results
- ✅ All critical bugs fixed, minor bugs tracked in GitHub Issues

---

## 11. Stretch Goals (If Time Permits)

- File attachments on tasks (Azure Blob Storage)
- Real-time updates via SignalR (instead of polling)
- Email notifications via SendGrid (real, not simulated)
- Dark mode toggle
- Mobile-responsive layout
- Export tasks to CSV/Excel

---

## 12. Learning Outcomes

After completing this mini project, interns will have hands-on experience with:

| Skill | How Learned |
|-------|-------------|
| CQRS + MediatR | Building commands & queries with separate handlers |
| EF Core Migrations | Creating and applying database migrations |
| Clean Architecture | Separating Domain, Application, Infrastructure layers |
| JWT Authentication | Implementing auth flow with IdentityServer |
| Redis Caching | Caching dashboard queries with cache invalidation |
| Background Jobs | Enqueuing and processing jobs with Hangfire |
| Elasticsearch | Setting up read-model sync + Kibana log viewing |
| React Query | Server state management with cache, refetch, mutations |
| Zustand | Client-only state management (auth tokens, UI state) |
| TypeScript | Type-safe frontend development |
| Form Validation | Zod schemas + React Hook Form |
| shadcn/ui + Tailwind | Modern component library + utility-first CSS |
| Docker Compose | Multi-service local development |
| Azure Deployment | Publishing apps to cloud |
| Test-Driven Mindset | Writing tests alongside code |
| Code Review | Giving and receiving constructive feedback |
| Git Collaboration | Branching, PRs, conflict resolution |
