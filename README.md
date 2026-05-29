# Fullstack Training 2026

Chương trình đào tạo full-stack developer cho intern 2026.

**Stack:** C# ASP.NET Core (backend) + React (frontend)

## Architecture

```
fullstack-training-2026/
├── backend/                # ASP.NET Core Web API
│   ├── Controllers/        # API endpoints
│   ├── Services/           # Business logic
│   ├── Models/             # Data models / DTOs
│   ├── Data/               # DbContext, migrations
│   └── Program.cs          # App entry point
├── frontend/               # React SPA (Vite)
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page-level components
│   │   ├── services/       # API client functions
│   │   └── App.tsx
│   └── package.json
├── .github/workflows/      # CI/CD pipeline
├── README.md               # This file
├── SETUP.md                # Local environment setup
└── CONVENTIONS.md           # Coding standards
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | ASP.NET Core 8, Entity Framework Core, SQL Server (or SQLite local) |
| Frontend | React 18+, TypeScript, Vite, CSS Modules (or Tailwind) |
| CI/CD | GitHub Actions |

## Workflow

1. Pick a task from GitHub Issues
2. Create a branch: `intern-X/task-XX-short-desc`
3. Code → Push → Open Pull Request
4. CI checks must pass (lint + build)
5. Code review → Address feedback → Merge

## Learning Objectives

By the end of this program, interns will be able to:
- Build RESTful APIs with ASP.NET Core
- Design and interact with databases using Entity Framework
- Build responsive UIs with React + TypeScript
- Use Git/GitHub for professional collaboration
- Write clean, maintainable, and testable code
- Understand CI/CD and automated testing

---

*Program duration: 1.5–2 months*
