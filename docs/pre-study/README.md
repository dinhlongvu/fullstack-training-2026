# Pre-Study — Learning Roadmap (2 Weeks)

Welcome to the Fullstack Training 2026 program!

Before jumping into the project, you need a solid foundation in the concepts below. The pre-study is split across **2 weeks**, ordered by **logical prerequisites** — each file builds on the ones before it.

**Rules:**
- 📖 Read in order (top to bottom) — the sequence matters
- 🔗 Click external links to dive deeper
- ❓ Have a question? Create a GitHub Issue with the `question` label
- ⏰ Deadline: **end of Week 1** (confirm with your mentor)

---

## 📅 Week 0 — Backend & API Foundations

Build a solid backend foundation, from C# language basics to designing and building APIs.

### Dev Track (Học & Bảo)

| # | File | Read Time | Topic | Prerequisite |
|---|------|:---:|--------|-------------|
| 01 | [C# Fundamentals](01-csharp-fundamentals.md) | 10 min | Types, LINQ, async/await, nullable reference types | None |
| 02 | [SOLID Principles](02-solid-principles.md) | 10 min | 5 design principles with C# examples | 01 |
| 03 | [Design Patterns](03-design-patterns.md) | 15 min | Repository, DI, Factory, Strategy, DTO | 02 |
| 04 | [REST API Design](04-rest-api-design.md) | 10 min | Resources, HTTP methods, status codes, pagination | 01 |
| 05 | [ASP.NET Core + Carter](05-aspnet-core-carter.md) | 10 min | Minimal API, Carter modules, middleware, MediatR integration | 03, 04 |
| 06 | [Git & GitHub](06-git-github-basics.md) | 10 min | Clone, branch, commit, PR, merge conflicts | None |

### QA Track (Phúc)

| # | File | Read Time | Topic |
|---|------|:---:|--------|
| QA-01 | [Testing Fundamentals](qa-01-testing-fundamentals.md) | 10 min | Test levels, test types, testing mindset |
| QA-02 | [Test Case Design](qa-02-test-case-design.md) | 10 min | Partitioning, boundary value, decision tables |
| QA-03 | [Bug Reporting](qa-03-bug-reporting.md) | 10 min | How to write effective bug reports |
| QA-04 | [API Testing](qa-04-api-testing.md) | 10 min | HTTP methods, Postman, status codes |
| QA-05 | [Test Planning](qa-05-test-plan.md) | 10 min | Test plan structure, test summary |

---

## 📅 Week 1 — Frontend & Infrastructure

Frontend development with TypeScript and React, plus the infrastructure tools that power the project.

### Dev Track (Học & Bảo)

| # | File | Read Time | Topic | Prerequisite |
|---|------|:---:|--------|-------------|
| 07 | [TypeScript Fundamentals](07-typescript-fundamentals.md) | 10 min | Types, interfaces, generics, React + TS patterns | 01 (C# concepts transfer) |
| 08 | [React Basics](08-react-basics.md) | 10 min | Components, props/state, hooks, React Router | **07** ⚠️ |
| 09 | [React Query](09-react-query.md) 🆕 | 10 min | Server state: useQuery, useMutation, cache, auto-refetch | 08 |
| 10 | [Zustand](10-zustand.md) 🆕 | 10 min | Client state: create, set, selectors, no prop drilling | 08 |
| 11 | [Forms & UI](11-forms-and-ui.md) 🆕 | 10 min | React Hook Form, Zod, Tailwind CSS, shadcn/ui | 08, 09 |
| 12 | [SQL Server & EF Core](12-sql-server-efcore.md) | 10 min | Entities, DbContext, LINQ queries, migrations, N+1 | 05 |
| 13 | [Docker & Containers](13-docker-container-basics.md) | 10 min | Images, containers, docker-compose, volumes | None |
| 14 | [JWT Authentication](14-jwt-authentication.md) 🆕 | 10 min | Token generation, validation, [Authorize], frontend auth flow | 05, 10 |
| 15 | [Validation & Mapping](15-validation-mapping.md) 🆕 | 10 min | FluentValidation, AutoMapper, pipeline behaviors | 05 |

### QA Track (Phúc)

| # | File | Read Time | Topic |
|---|------|:---:|--------|
| QA-06 | [Postman Advanced](qa-06-postman-advanced.md) | 10 min | Collections, environments, test scripts |
| QA-07 | [API Automation Basics](qa-07-api-automation-basics.md) | 10 min | Arrange→Act→Assert, test pyramid, xUnit intro |

---

## Prerequisites

Before starting, install these tools:

| Tool | Version | Download |
|------|---------|----------|
| .NET SDK | 8.0 | [dotnet.microsoft.com](https://dotnet.microsoft.com/download) |
| Node.js | 20 LTS | [nodejs.org](https://nodejs.org/) |
| Git | Latest | [git-scm.com](https://git-scm.com/) |
| VS Code | Latest | [code.visualstudio.com](https://code.visualstudio.com/) |
| Visual Studio 2022 | Community | [visualstudio.com](https://visualstudio.microsoft.com/) |
| Postman | Latest | [postman.com](https://www.postman.com/downloads/) |
| Docker Desktop | Latest | [docker.com](https://www.docker.com/products/docker-desktop/) |
| SSMS | Latest | [SSMS download](https://learn.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms) |

**VS Code Extensions:** C# Dev Kit, ES7+ React Snippets, Prettier, Docker, Thunder Client

---

## External Learning Resources

| Topic | Link |
|--------|------|
| C# | [Microsoft Learn — C#](https://learn.microsoft.com/en-us/dotnet/csharp/) |
| ASP.NET Core | [Microsoft Learn — ASP.NET](https://learn.microsoft.com/en-us/aspnet/core/) |
| Carter | [Carter GitHub](https://github.com/CarterCommunity/Carter) |
| React | [React.dev](https://react.dev/learn) |
| TypeScript | [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/) |
| SOLID | [Refactoring Guru — SOLID](https://refactoring.guru/design-patterns/solid) |
| Docker | [Docker Docs](https://docs.docker.com/get-started/) |
| REST API | [REST API Tutorial](https://restfulapi.net/) |
| SQL | [SQLBolt](https://sqlbolt.com/) |
| Git | [Oh Shit, Git!?!](https://ohshitgit.com/) |
| Testing | [Ministry of Testing](https://www.ministryoftesting.com/) |
| Postman | [Postman Learning Center](https://learning.postman.com/) |

---

## Mini-Check Assignments

At the end of each week, your mentor will give you a short assignment to verify your understanding:

- **Week 0 Mini-Check**: Covers backend + API concepts (files 01–06)
- **Week 1 Mini-Check**: Covers frontend + infrastructure (files 07–15)

> **Note:** The mini-checks are designed by the CEO at the end of each week — not pre-defined. Focus on understanding the concepts, not "studying for the test."

---

> **Got a question?** Create an issue on this repo with the `question` label — your mentor will answer!
