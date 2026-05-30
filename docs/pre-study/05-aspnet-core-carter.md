# 05 — ASP.NET Core + Carter (Minimal API)

ASP.NET Core 8 is the backend framework. This project uses **Carter** — a library that brings a clean, modular approach to Minimal APIs.

> **Prerequisites:** You should have read [04 — REST API Design](04-rest-api-design.md) first to understand what a good API looks like.

---

## 1. Why Carter? (Not Traditional Controllers)

Traditional ASP.NET Core uses `[ApiController]` classes. Carter takes the **Minimal API** approach — endpoints are defined as functions, organized into **modules**:

```csharp
// Carter module — each module = one resource group
public class UsersModule : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/users", async (AppDbContext db) =>
        {
            var users = await db.Users.ToListAsync();
            return Results.Ok(users);
        });

        app.MapGet("/api/users/{id}", async (int id, AppDbContext db) =>
        {
            var user = await db.Users.FindAsync(id);
            return user is null ? Results.NotFound() : Results.Ok(user);
        });

        app.MapPost("/api/users", async (CreateUserDto dto, AppDbContext db) =>
        {
            var user = new User { Name = dto.Name, Email = dto.Email };
            db.Users.Add(user);
            await db.SaveChangesAsync();
            return Results.Created($"/api/users/{user.Id}", user);
        });
    }
}
```

**Key differences from Controllers:**

| Controller-Based (Old) | Carter/Minimal API (What we use) |
|------------------------|----------------------------------|
| `[ApiController]` class + `[HttpGet]` attributes | `ICarterModule` interface + `MapGet`/`MapPost` |
| One class per controller | One module per resource group |
| Convention-based routing | Explicit route registration |
| `IActionResult` / `ActionResult<T>` | `IResult` / `Results.Ok()` |
| Constructor injection | Method parameter injection |

---

## 2. Registering Carter

```csharp
// Program.cs
var builder = WebApplication.CreateBuilder(args);

// Add Carter services
builder.Services.AddCarter();

// Add other services
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("Default")));

// Build the app
var app = builder.Build();

// Map Carter modules
app.MapCarter();  // Automatically discovers all ICarterModule implementations

app.Run();
```

---

## 3. Middleware Pipeline

Every HTTP request flows through middleware components **in order**:

```
Request → [Logger] → [Auth] → [CORS] → [Carter Routes] → Response
```

```csharp
// Program.cs — ORDER MATTERS
var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>(); // Must be FIRST — catches all errors
app.UseSwagger();
app.UseSwaggerUI();
app.UseAuthentication();        // Who are you?
app.UseAuthorization();         // What can you do?
app.MapCarter();               // Route to Carter modules ← MUST be after auth

app.Run();
```

> **Rule:** `UseAuthentication` must come before `UseAuthorization`. `MapCarter` comes after both. `ExceptionHandlingMiddleware` should be the first middleware to catch exceptions from everything downstream.

---

## 4. Model Binding in Minimal API

Parameters are automatically bound from the HTTP request:

```csharp
app.MapGet("/api/users/{id}", (int id) => ...);           // ← From route
app.MapGet("/api/users", (string? sort = "name") => ...);  // ← From query string
app.MapPost("/api/users", (CreateUserDto dto) => ...);     // ← From JSON body ([FromBody] inferred)
app.MapPost("/api/upload", async (IFormFile file) => ...); // ← From form data
```

| Source | How | Example |
|--------|-----|---------|
| Route | `{param}` in URL | `/api/users/{id}` → `int id` |
| Query string | Parameter name matches | `?sort=name` → `string sort` |
| JSON body | Complex type parameter | `CreateUserDto dto` (auto-bound) |
| Form/file | `IFormFile` parameter | File upload |
| Services | Registered in DI | `AppDbContext db`, `IMediator mediator` |

---

## 5. CQRS with MediatR + Carter

In the mini project, we combine Carter with MediatR for CQRS:

```csharp
public class TasksModule : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/projects/{projectId}/tasks");

        // Query
        group.MapGet("/", async (int projectId, IMediator mediator) =>
        {
            var tasks = await mediator.Send(new GetTasksQuery(projectId));
            return Results.Ok(tasks);
        });

        // Command
        group.MapPost("/", async (int projectId, CreateTaskCommand command, IMediator mediator) =>
        {
            command = command with { ProjectId = projectId };
            var task = await mediator.Send(command);
            return Results.Created($"/api/tasks/{task.Id}", task);
        });
    }
}
```

> **Why Carter + MediatR?** Carter modules stay thin — they only handle HTTP concerns. MediatR handlers contain business logic. This keeps the architecture clean and testable.

---

## 6. Swagger / OpenAPI

```csharp
// Program.cs
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();        // JSON at /swagger/v1/swagger.json
    app.UseSwaggerUI();      // UI at /swagger/index.html
}
```

**Why it matters for QA:** Swagger shows every endpoint, its parameters, and lets you test directly in the browser.

---

## 7. Configuration & appsettings.json

```json
// appsettings.json
{
  "ConnectionStrings": {
    "Default": "Server=localhost,1433;Database=TeamCollab;User=sa;Password=...;TrustServerCertificate=True"
  },
  "Jwt": {
    "Key": "your-secret-key-here",
    "Issuer": "training-api"
  }
}
```

```csharp
// Access settings via IConfiguration (injected automatically)
app.MapGet("/api/config-check", (IConfiguration config) =>
{
    var db = config.GetConnectionString("Default");
    var issuer = config["Jwt:Issuer"];
    return Results.Ok(new { db, issuer });
});
```

> **Rule:** Secrets (connection strings, JWT keys) go in `appsettings.Development.json` or User Secrets. Never commit them to Git.

---

## 📚 Further Reading

- [Carter Documentation](https://github.com/CarterCommunity/Carter) — official repo
- [Minimal APIs Overview](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis) — Microsoft docs
- [MediatR + Carter example](https://github.com/CarterCommunity/Carter) — combined patterns
- [ASP.NET Core Middleware](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/middleware/)

---

> **Tip:** The best way to learn is to build. After reading 04 (REST API Design) and this, create a new Carter project, add a single module with GET/POST, and test with `curl` or Postman.
