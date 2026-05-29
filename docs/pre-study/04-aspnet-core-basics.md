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

## 4. Model Binding — How Parameters Get Their Values

ASP.NET Core automatically maps HTTP request data to your action parameters:

```csharp
[HttpGet("api/users/{id}")]
public IActionResult GetUser(
    int id,                              // ← From route: /api/users/5
    [FromQuery] string? sort = null)     // ← From query string: ?sort=name
{ ... }

[HttpPost("api/users")]
public IActionResult Create(
    [FromBody] CreateUserDto dto)        // ← From JSON request body
{ ... }

[HttpPost("api/users/{id}/avatar")]
public IActionResult UploadAvatar(
    int id,                              // ← From route
    [FromForm] IFormFile file)           // ← From form data (file upload)
{ ... }
```

| Attribute | Source | Example |
|-----------|--------|---------|
| `[FromRoute]` | URL path | `/api/users/{id}` |
| `[FromQuery]` | Query string | `?sort=name&page=1` |
| `[FromBody]` | Request body (JSON) | `{"name": "Alice"}` |
| `[FromForm]` | Form data | File uploads, HTML forms |
| `[FromHeader]` | HTTP header | `Authorization` token |

> The `[ApiController]` attribute applies automatic inference: simple types (int, string, bool) default to `[FromRoute]` or `[FromQuery]`, complex types default to `[FromBody]`. But it's clearer to be explicit.

---

## 5. Entity Framework Core (EF Core)

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

## 6. HTTP Status Codes

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

## 7. Configuration & appsettings.json

ASP.NET Core reads settings from `appsettings.json` (and `appsettings.Development.json` for local dev):

```json
// appsettings.json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=app.db"
  },
  "Jwt": {
    "Key": "your-secret-key-here",
    "Issuer": "training-api"
  }
}
```

```csharp
// Inject IConfiguration to read settings
public class UserService
{
    private readonly IConfiguration _config;
    public UserService(IConfiguration config) => _config = config;

    public string GetConnectionString()
        => _config.GetConnectionString("DefaultConnection");

    public string GetJwtKey()
        => _config["Jwt:Key"];  // Colon accesses nested keys
}
```

---

## 8. Swagger / OpenAPI

Swagger provides an automatic, interactive API documentation page. Almost every .NET API project uses it:

```csharp
// Program.cs — add Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();           // http://localhost:5001/swagger
    app.UseSwaggerUI();         // http://localhost:5001/swagger/index.html
}
```

**Why it matters for QA (Phúc):** Swagger shows every endpoint, its parameters, and lets you test them directly in the browser — no Postman needed for quick tests.

---

## 📚 Further Reading

- [Microsoft Learn — ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/)
- [Create a web API with ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/tutorials/first-web-api)
- [EF Core Getting Started](https://learn.microsoft.com/en-us/ef/core/get-started/overview/first-app)
- [HTTP Status Codes Cheat Sheet](https://httpstatuses.io/)

---

> **Tip:** The best way to learn is to build. Create a new ASP.NET Core project, add a simple CRUD controller, and test it with Postman or `curl`.
