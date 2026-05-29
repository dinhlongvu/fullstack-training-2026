# 04 — ASP.NET Core Basics

ASP.NET Core is a cross-platform, high-performance framework for building web APIs and web applications. It's the backbone of this project's backend.

---

## 1. Minimal API vs Controller-Based

This project uses **Controller-Based APIs** (traditional, structured):

```csharp
// Controller-based (what we use)
[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<UserDto>>> GetAll() { ... }

    [HttpGet("{id}")]
    public async Task<ActionResult<UserDto>> GetById(int id) { ... }

    [HttpPost]
    public async Task<ActionResult<UserDto>> Create(CreateUserDto dto) { ... }

    [HttpPut("{id}")]
    public async Task<ActionResult> Update(int id, UpdateUserDto dto) { ... }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id) { ... }
}
```

---

## 2. Routing

```csharp
// Attribute routing (preferred)
[Route("api/users")]                    // → /api/users
[Route("api/users/{id}")]               // → /api/users/5
[Route("api/users/{id}/orders")]        // → /api/users/5/orders

// HTTP method attributes
[HttpGet]           // matches GET requests
[HttpPost]          // matches POST requests
[HttpPut("{id}")]   // matches PUT requests
[HttpDelete("{id}")]// matches DELETE requests
```

---

## 3. Middleware Pipeline

Every HTTP request flows through a pipeline of middleware components:

```
Request → [Logger] → [Auth] → [CORS] → [Routing] → [Controller] → Response
```

```csharp
// Program.cs — the middleware pipeline
var app = builder.Build();

app.UseHttpsRedirection();      // Force HTTPS
app.UseCors("AllowAll");        // Cross-Origin Resource Sharing
app.UseAuthentication();        // Who are you?
app.UseAuthorization();         // What can you do?
app.MapControllers();           // Route to controllers

app.Run();
```

**Order matters!** `UseAuthentication` must come before `UseAuthorization`.

---

## 4. Entity Framework Core (EF Core)

EF Core is the ORM (Object-Relational Mapper) — it maps C# classes to database tables.

```csharp
// Entity (maps to a database table)
public class User
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Email { get; set; }
    public DateTime CreatedAt { get; set; }
}

// DbContext (the bridge to the database)
public class AppDbContext : DbContext
{
    public DbSet<User> Users { get; set; } // → "Users" table

    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options) { }
}

// Program.cs — register DbContext
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite("Data Source=app.db")); // SQLite for local dev
```

---

## 5. HTTP Status Codes

Return the right status code for each situation:

| Code | Meaning | When to use |
|------|---------|-------------|
| `200 OK` | Success | GET, PUT, PATCH succeeded |
| `201 Created` | Resource created | POST succeeded |
| `204 No Content` | Success, no body | DELETE succeeded |
| `400 Bad Request` | Client error | Invalid input, validation failed |
| `401 Unauthorized` | Not authenticated | Missing/invalid token |
| `403 Forbidden` | No permission | Authenticated but not allowed |
| `404 Not Found` | Resource missing | ID doesn't exist |
| `500 Internal Server Error` | Server error | Unexpected exception |

```csharp
[HttpGet("{id}")]
public async Task<ActionResult<UserDto>> GetById(int id)
{
    var user = await _service.GetByIdAsync(id);
    if (user == null) return NotFound();           // 404
    return Ok(user);                                // 200
}

[HttpPost]
public async Task<ActionResult<UserDto>> Create(CreateUserDto dto)
{
    var user = await _service.CreateAsync(dto);
    return CreatedAtAction(nameof(GetById), new { id = user.Id }, user); // 201
}
```

---

## 📚 Further Reading

- [Microsoft Learn — ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/)
- [Create a web API with ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/tutorials/first-web-api)
- [EF Core Getting Started](https://learn.microsoft.com/en-us/ef/core/get-started/overview/first-app)
- [HTTP Status Codes Cheat Sheet](https://httpstatuses.io/)

---

> **Tip:** The best way to learn is to build. Create a new ASP.NET Core project, add a simple CRUD controller, and test it with Postman or `curl`.
