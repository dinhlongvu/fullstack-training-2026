# Fullstack Training 2026

Chương trình đào tạo cho intern 2026 — 2 Fullstack Developers + 1 QA.

**Stack:** C# ASP.NET Core (backend) + React (frontend) + Manual/Automated Testing (QA)

## Team

| Role | Intern | Mentor |
|------|--------|--------|
| Fullstack Dev | Intern A | CEO (Kaito) + AI Agent (Ella) |
| Fullstack Dev | Intern B | CEO (Kaito) + AI Agent (Ella) |
| QA | Intern C | QA Senior (kiến thức nền) + AI Agent (Ella) |

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
├── qa/                     # QA workspace
│   ├── test-plans/         # Test plans cho từng feature
│   ├── test-cases/         # Test cases chi tiết
│   ├── bug-reports/        # Bug report templates
│   └── automated/          # Automated tests (Playwright)
├── .github/workflows/      # CI/CD pipeline
├── README.md               # This file
├── SETUP.md                # Local environment setup
└── CONVENTIONS.md           # Coding standards
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | ASP.NET Core 8, Entity Framework Core, SQLite (local) / SQL Server |
| Frontend | React 18+, TypeScript, Vite, CSS Modules |
| QA | Manual testing, Test case design, Playwright (automation) |
| CI/CD | GitHub Actions |

## Workflow

### Dev Flow
1. Pick a dev task from GitHub Issues
2. Create a branch: `intern-X/task-XX-short-desc`
3. Code → Push → Open Pull Request
4. CI checks must pass (lint + build)
5. AI review (first pass) → CEO review (final)
6. Merge into `training/` branch

### QA Flow
1. Dev feature merged into `training/`
2. QA writes test cases → saves in `qa/test-cases/`
3. QA performs manual testing
4. Found a bug? → Create GitHub Issue with label `bug`
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
- Build RESTful APIs with ASP.NET Core
- Design and interact with databases using Entity Framework
- Build responsive UIs with React + TypeScript
- Use Git/GitHub for professional collaboration
- Write clean, maintainable, and testable code
- Understand CI/CD and automated testing

### QA Intern
- Design test plans and test cases
- Perform manual testing: functional, UI, regression
- Write clear, actionable bug reports
- Verify bug fixes and track bug lifecycle
- Understand Dev-QA collaboration in Agile
- Basic automated testing with Playwright

---

*Program duration: 1.5–2 months*
