![CI Status](https://github.com/dinhlongvu/fullstack-training-2026/actions/workflows/ci.yml/badge.svg)

# Fullstack Training 2026

Intern training program 2026 — 2 Fullstack Developers + 1 QA. Learning through a real project: building a **TaskBoard** app (simple Kanban board) in 6 weeks.

**Stack:** .NET 8 (Carter + MediatR + CQRS) + React 18 (TypeScript) + SQLite + Docker (optional)

## Team

| Role | GitHub Label | Intern | Mentor |
|------|-------------|--------|--------|
| Fullstack Dev | `hoc` | **Triệu Quang Học** | CEO (Kaito) + AI Agent (Ella) |
| Fullstack Dev | `bao` | **Đinh Lâm Gia Bảo** | CEO (Kaito) + AI Agent (Ella) |
| QA | `phuc` | **Nguyễn Thị Hoàng Phúc** | QA Senior + AI Agent (Ella) |

## Architecture

```
fullstack-training-2026/
├── backend/                          # .NET 8 — Clean Architecture + CQRS
│   ├── Backend.csproj                # Project file + NuGet references
│   ├── Program.cs                    # Entry point + DI registration
│   ├── Domain/                       # Entity classes (maps to DB tables)
│   │   ├── User.cs                   #   Id, Email, FullName, PasswordHash
│   │   ├── Project.cs                #   Id, Name, CreatedBy (FK → User)
│   │   ├── ProjectMember.cs          #   Join table: Project ↔ User
│   │   ├── TaskItem.cs               #   Title, Status (enum), Priority (enum), Assignee
│   │   └── Comment.cs                #   Content, Author, Task (FK)
│   ├── DTOs/                         # Data Transfer Objects (what API returns)
│   │   └── TaskDto.cs                #   TaskDto (full) + TaskSummaryDto (list)
│   ├── Modules/                      # Carter modules (1 file = 1 resource group)
│   │   └── TasksModule.cs            #   GET/POST/PATCH/DELETE /api/tasks 🔧
│   │   ··· AuthModule.cs             #   (intern will create)
│   │   ··· ProjectsModule.cs
│   │   ··· CommentsModule.cs
│   │   ··· DashboardModule.cs
│   ├── Commands/                     # CQRS Commands (write) — 1 file = 1 operation
│   │   └── Tasks/
│   │       ├── CreateTask.cs         #   Command + Handler ✅ (complete sample)
│   │       ├── UpdateTaskStatusCommand.cs  #   Command record 🔧 (handler stub)
│   │       └── DeleteTaskCommand.cs  #   Command record 🔧 (handler stub)
│   │   ··· Auth/                     #   (intern will create)
│   │   ··· Projects/
│   │   ··· Comments/
│   ├── Queries/                      # CQRS Queries (read) — 1 file = 1 operation
│   │   └── Tasks/
│   │       └── GetTasks.cs           #   Query + Handler + filters ✅ (complete sample)
│   │   ··· Auth/, Projects/, Comments/, Dashboard/  # (intern will create)
│   ├── Infrastructure/Data/          # EF Core = Repository + Unit of Work
│   │   ├── AppDbContext.cs            #   DbContext + DbSet<T> (no extra repo wrapper)
│   │   └── Configurations/
│   │       └── TaskConfiguration.cs  #   Fluent API (keys, indexes, relationships, enums)
│   │       ··· UserConfiguration.cs  #   (intern will create)
│   ├── Validation/                   # FluentValidation + MediatR pipeline
│   │   ├── CreateTaskCommandValidator.cs  #   RuleFor — auto-runs before handler
│   │   └── ValidationBehavior.cs      #   IPipelineBehavior — auto-validates all requests
│   ├── Mapping/                      # AutoMapper profiles
│   │   └── TaskMappingProfile.cs      #   Entity ↔ DTO, Command → Entity
│   └── Middleware/                    # ASP.NET middleware
│       └── ExceptionHandlingMiddleware.cs  #   Global error handler → JSON response
│
│   ✅ = complete sample (real code, compiles)
│   🔧 = stub (declared, intern completes handler)
│   ··· = empty folder (intern creates when building feature)
│
├── frontend/                         # React 18 + TypeScript + Vite
│   ├── src/
│   │   ├── components/               # Shared components
│   │   │   └── ui/                   # shadcn/ui components (Button, Dialog, Table...)
│   │   ├── features/                 # Feature-based modules
│   │   │   ├── auth/                 #   LoginPage, RegisterPage, AuthGuard
│   │   │   ├── projects/             #   ProjectList, ProjectCard, CreateProjectDialog
│   │   │   ├── tasks/                #   KanbanBoard, TaskCard, CreateTaskDialog
│   │   │   ├── comments/             #   CommentList, CommentForm
│   │   │   └── dashboard/            #   StatsCards, UpcomingDeadlines
│   │   ├── stores/                   # Zustand stores (auth, UI)
│   │   ├── hooks/                    # Custom hooks
│   │   ├── api/                      # API client (axios/fetch + React Query)
│   │   ├── lib/                      # Utilities, constants, types
│   │   └── App.tsx                   # Router + Layout
│   ├── package.json
│   └── vite.config.ts
│
├── docs/
│   ├── mini-project.md               # TaskBoard specification
│   └── pre-study/                    # 15 dev + 7 QA pre-study files
│
├── qa/                               # QA workspace
│   ├── test-plans/                   # Test plans for each feature
│   ├── test-cases/                   # Detailed test cases
│   ├── bug-reports/                  # Bug report templates
│   └── postman/                      # Postman collections + environments
│
├── docker-compose.yml                # SQL Server container (optional — SQLite is default)
├── .github/workflows/                # CI/CD (lint + build on PR)
├── .github/PULL_REQUEST_TEMPLATE.md
├── README.md                         # This file
├── SETUP.md                          # Local environment setup
└── CONVENTIONS.md                    # Coding standards
```

## Tech Stack

### Backend

| Layer | Technology |
|-------|-----------|
| Framework | .NET 8 |
| API | Carter (Minimal API) |
| Architecture | Clean Architecture, CQRS with MediatR |
| ORM | Entity Framework Core 8 + SQLite |
| Validation | FluentValidation |
| Mapping | AutoMapper |
| Auth | JWT (JSON Web Tokens) |
| Logging | Serilog |

### Frontend

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build Tool | Vite |
| Routing | React Router v6 |
| Server State | React Query (TanStack Query) |
| Client State | Zustand |
| Forms | React Hook Form + Zod |
| UI Components | shadcn/ui |
| Styling | Tailwind CSS |

### Infrastructure & QA

| Layer | Technology |
|-------|-----------|
| Database | SQLite (file-based, no setup required) |
| CI/CD | GitHub Actions (lint + build) |
| Manual Testing | Test cases, exploratory testing |
| API Testing | Postman (collections + test scripts) |
| Bug Tracking | GitHub Issues |

## Workflow

### Dev Flow

1. Pick a task from GitHub Issues → assign yourself
2. Branch from `main`: `hoc/task-XX-desc` or `bao/task-XX-desc`
3. Code → Commit → Push → Open Pull Request to `main`
4. CI must pass (lint + build)
5. AI review (first pass) → CEO review (final)
6. CEO merges into `main`

### QA Flow

1. Dev feature merged into `main`
2. QA writes test cases → saves in `qa/test-cases/`
3. QA performs manual testing + API testing with Postman
4. Found a bug? → Create GitHub Issue with label `bug`, assign to dev
5. Dev fixes bug → QA verifies → Close bug
6. All tests passed? → Feature ready for CEO final approval

```
Dev builds → QA tests → Bug found? ──YES──→ Dev fixes → QA verifies
                 │                                        │
                 NO                                       │
                 ↓                                        ↓
           QA PASSED ✅ ←────────────────────── Bug CLOSED
```

## Learning Objectives

### Dev Interns

- **Backend**: Build RESTful APIs with Carter + MediatR + CQRS pattern
- **Database**: Design schemas, write LINQ queries, manage migrations with EF Core
- **Auth**: Implement JWT authentication + protected routes
- **Frontend**: Build SPA with React 18 + TypeScript + React Router
- **State**: Manage server state (React Query) and client state (Zustand)
- **Forms**: Build validated forms with React Hook Form + Zod
- **UI**: Style with Tailwind CSS, use shadcn/ui component library
- **Git**: Professional branching, PR workflow, code review
- **CI/CD**: Automated lint + build on every PR

### QA Intern

- Design test plans and test cases for REST APIs
- Perform manual testing: functional, UI, regression
- API testing with Postman (collections, environments, test scripts)
- Write clear, actionable bug reports on GitHub Issues
- Verify bug fixes and track bug lifecycle
- Understand Dev-QA collaboration in Agile workflow

---

*Program duration: 8 weeks training (2 weeks pre-study + 6 weeks mini project) + real project onboarding*
