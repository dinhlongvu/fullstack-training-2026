# Setup Guide

Step-by-step instructions to get your local development environment running.

## Prerequisites

Install these tools before starting:

### 1. .NET SDK 8.0

```bash
# macOS (Homebrew)
brew install dotnet-sdk

# Windows — download from: https://dotnet.microsoft.com/download

# Verify
dotnet --version  # should show 8.0.x
```

### 2. Node.js 20 LTS

```bash
# macOS (Homebrew)
brew install node@20

# Windows — download from: https://nodejs.org/

# Verify
node --version   # should show v20.x.x
npm --version    # should show 10.x.x
```

### 3. Visual Studio Code

Download from: https://code.visualstudio.com/

**Recommended Extensions:**
- C# Dev Kit (Microsoft)
- Prettier - Code formatter
- Thunder Client (API testing)

### 4. Git

```bash
# macOS — included with Xcode Command Line Tools
git --version
```

---

## Quick Start (5 minutes)

```bash
# 1. Clone the repo
git clone https://github.com/dinhlongvu/fullstack-training-2026.git
cd fullstack-training-2026

# 2. Create your local config (copy from example)
cp backend/appsettings.Development.example.json backend/appsettings.Development.json
# (appsettings.Development.json is gitignored — each dev has their own)

# 3. Install backend dependencies
cd backend
dotnet restore

# 3. Create the database (SQLite — file-based, no extra setup needed)
dotnet ef migrations add InitialCreate
dotnet ef database update

# 4. Run the backend
dotnet run
# API runs at: https://localhost:5001
# Swagger UI: https://localhost:5001/swagger

# 5. In a NEW terminal, install & run the frontend
cd ../frontend
npm install
npm run dev
# App runs at: http://localhost:5173
```

**Verification checklist:**
- [ ] `dotnet --version` shows 8.0.x
- [ ] `node --version` shows v20.x.x
- [ ] Backend: open https://localhost:5001/swagger → see API endpoints
- [ ] Frontend: open http://localhost:5173 → see TaskBoard placeholder page
- [ ] Try `GET /api/projects/1/tasks` in Swagger → returns `[]` (empty list)

If all checks pass, you're ready for the mini-project!

---

## Database

**The project uses SQLite** — a file-based database. No Docker, no server setup required.

- The database file `TaskBoard.db` is created automatically on first run
- It lives in the `backend/` directory and is gitignored
- Connection string is in `backend/appsettings.Development.json`

> **Advanced (optional):** To switch to SQL Server later, see `docker-compose.yml` for reference.

---

## Day 1 Checklist

### ALL INTERNS — First 2 Hours

```
1. [ ] Clone the repo & install dependencies (see Quick Start above)
2. [ ] Start the backend → verify Swagger at https://localhost:5001/swagger
3. [ ] Start the frontend → verify it loads at http://localhost:5173
4. [ ] Create your first branch:
       git checkout -b <label>/task-00-setup
5. [ ] Make a small change (e.g., add your name to this file)
6. [ ] Commit & push:
       git add .
       git commit -m "chore(setup): verify environment"
       git push -u origin <label>/task-00-setup
7. [ ] Open a Pull Request on GitHub (just for practice)
8. [ ] Ask your mentor to review — this proves you can do the full Git workflow
```

### Học — Day 1 After Setup (Backend)

```
1. [ ] Read these files carefully (they are your reference implementations):
       backend/Modules/TasksModule.cs      ← How Carter modules work
       backend/Commands/Tasks/CreateTask.cs  ← Full CQRS command + handler
       backend/Queries/Tasks/GetTasks.cs     ← Full CQRS query + handler

2. [ ] Open https://localhost:5001/swagger and try:
       POST /api/projects/1/tasks  → create a task
       GET  /api/projects/1/tasks  → see the task you created

3. [ ] Read backend/Commands/Tasks/UpdateTaskStatusCommand.cs
       → Notice the handler is empty (stub)

4. [ ] YOUR FIRST TASK: Implement UpdateTaskStatusHandler
       Pattern to follow: CreateTaskHandler in CreateTask.cs
       Steps:
         a. Find the task by ID: _db.Tasks.FindAsync(cmd.TaskId)
         b. Update the status: task.Status = cmd.Status
         c. Save: await _db.SaveChangesAsync(ct)
       Should be ~15 lines of code. Run in Swagger to test.

5. [ ] If stuck: check the GetTasks.cs handler for pattern reference.
       Still stuck? Create a GitHub Issue with the "question" label.
```

### Bảo — Day 1 After Setup (Frontend)

```
1. [ ] Read these files to understand the scaffold:
       frontend/src/App.tsx              ← Router + all routes
       frontend/src/components/Layout.tsx ← Sidebar + header
       frontend/src/stores/useAuthStore.ts ← Auth state (Zustand)
       frontend/src/lib/api.ts           ← API fetch wrapper

2. [ ] Open http://localhost:5173 → see the placeholder pages
3. [ ] Click through: /login, /projects, /dashboard

4. [ ] YOUR FIRST TASK: Build the Login form
       File: frontend/src/pages/LoginPage.tsx
       Requirements:
         a. Use React Hook Form + Zod for validation
         b. On submit: call POST /api/auth/login via apiFetch()
         c. On success: store token in useAuthStore, redirect to /projects
         d. Show error message on failure
       Reference: pre-study files 08 (React), 11 (Forms & UI), 10 (Zustand)

5. [ ] For now, the auth API doesn't exist yet — you can:
       a. Build the form UI with validation (works without backend)
       b. Mock the API call temporarily (return fake token)
       c. Connect to the real API once Học builds it in Week 3

6. [ ] If stuck: ask your mentor or create a GitHub Issue.
```

### Phúc — Day 1 After Setup (QA)

```
1. [ ] Open https://localhost:5001/swagger
2. [ ] Explore the Tasks endpoints (the only ones built so far)
3. [ ] Try each endpoint using "Try it out" in Swagger

4. [ ] YOUR FIRST TASK: Write 5 test cases for the Tasks API
       Save in: qa/test-cases/tasks-api.md
       Template: see pre-study QA-02

       Test cases to write:
         TC-01: GET /api/projects/{id}/tasks → returns 200 + task list
         TC-02: GET /api/projects/{id}/tasks with empty project → 200 + []
         TC-03: GET /api/projects/{id}/tasks with non-existent project → 404
         TC-04: POST /api/projects/{id}/tasks with valid data → 201
         TC-05: POST /api/projects/{id}/tasks without title → 400

5. [ ] Execute each test case using Swagger
6. [ ] Document: what was the actual result? Pass or fail?

7. [ ] BONUS: Read pre-study QA-06 (Postman Advanced)
       Create a Postman collection for the Tasks API
       Save in: qa/postman/tasks-api.postman_collection.json
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `dotnet: command not found` | Install .NET SDK 8.0 (see Prerequisites) |
| `npm: command not found` | Install Node.js 20 (see Prerequisites) |
| `dotnet restore` fails | Check internet connection, try `dotnet nuget locals all --clear` |
| `npm install` fails | Delete `node_modules` and `package-lock.json`, run `npm install` again |
| `dotnet ef` not found | Install: `dotnet tool install --global dotnet-ef` |
| Port 5001 already in use | Change port in `backend/Properties/launchSettings.json` |
| Port 5173 already in use | Vite auto-picks the next available port |
| Backend can't find database | Run `dotnet ef database update` from the `backend/` folder |
| "No database provider has been configured" | Make sure you ran `dotnet ef migrations add InitialCreate` |
| Swagger shows "Failed to load" | Check that `dotnet run` completed without errors |
| Frontend shows blank page | Open browser DevTools (F12) → Console tab → check for errors |
| API call returns CORS error | Make sure backend is running AND vite.config.ts has the proxy configured |

---

*If you're stuck for more than 30 minutes, ask your mentor. Don't suffer in silence!*
