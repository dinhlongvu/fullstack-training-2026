# 03 — Design Patterns

Design patterns are proven solutions to common software design problems. You don't need to memorize them all — just know **when to use which pattern**.

---

## 1. Repository Pattern

> Separates data access logic from business logic.

```csharp
// Interface (abstraction)
public interface IUserRepository
{
    Task<User?> GetByIdAsync(int id);
    Task<List<User>> GetAllAsync();
    Task<User> AddAsync(User user);
    Task SaveChangesAsync();
}

// Implementation (concrete)
public class UserRepository : IUserRepository
{
    private readonly AppDbContext _db;
    public UserRepository(AppDbContext db) => _db = db;

    public async Task<User?> GetByIdAsync(int id)
        => await _db.Users.FindAsync(id);

    public async Task<List<User>> GetAllAsync()
        => await _db.Users.ToListAsync();

    public async Task<User> AddAsync(User user)
    {
        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        return user;
    }
}

// Usage in a Service
public class UserService
{
    private readonly IUserRepository _repo;
    public UserService(IUserRepository repo) => _repo = repo;
    // ...
}
```

**Why:**
- Swap databases (SQL → Mongo) by creating a new class that implements the same interface
- Easy to test: mock `IUserRepository`
- Business logic doesn't know where data comes from

> **Note for this project:** We do NOT wrap EF Core's `DbSet<T>` in a separate repository. EF Core's `DbSet<T>` IS the repository — it already implements the Repository and Unit of Work patterns. Our CQRS handlers inject `AppDbContext` directly (see `CreateTaskHandler` in the backend code). The Repository pattern is taught here as a concept you should understand, but in practice, don't wrap EF Core.

---

## 2. Dependency Injection (DI)

> The framework automatically injects dependencies — no `new` needed.

```csharp
// Program.cs — register services
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IUserService, UserService>();

// Carter module — dependencies injected via method parameters (Minimal API)
public class UsersModule : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/users/{id}", async (int id, IUserService service) =>
        {
            var user = await service.GetByIdAsync(id);
            return user is null ? Results.NotFound() : Results.Ok(user);
        });
    }
}
// IUserService is injected automatically by the framework — no manual instantiation.
// In this project we use Carter (Minimal API), not traditional [ApiController].
// See file 05-aspnet-core-carter.md for details.
```

**Lifetimes:**

| Lifetime | Created | Use for |
|----------|---------|---------|
| `AddTransient` | Every request | Lightweight, stateless services |
| `AddScoped` | Once per HTTP request | DbContext (most common) |
| `AddSingleton` | Once, shared | Cache, configuration |

---

## 3. Factory Pattern

> Creates objects without exposing the instantiation logic.

```csharp
public interface IPaymentProcessor
{
    Task<PaymentResult> ProcessAsync(decimal amount);
}

public class VnPayProcessor : IPaymentProcessor { /* ... */ }
public class MomoProcessor : IPaymentProcessor { /* ... */ }

public class PaymentProcessorFactory
{
    public IPaymentProcessor Create(string method) => method switch
    {
        "vnpay" => new VnPayProcessor(),
        "momo"  => new MomoProcessor(),
        _       => throw new ArgumentException("Unknown payment method")
    };
}
```

---

## 4. Strategy Pattern

> Select an algorithm at runtime — similar to Factory but focused on **behavior**.

```csharp
// Already seen in SOLID — Open/Closed Principle
public interface ISortStrategy
{
    List<User> Sort(List<User> users);
}
public class SortByName : ISortStrategy
{
    public List<User> Sort(List<User> users) => users.OrderBy(u => u.Name).ToList();
}
public class SortByAge : ISortStrategy
{
    public List<User> Sort(List<User> users) => users.OrderBy(u => u.Age).ToList();
}

// Register all strategies in DI
builder.Services.AddScoped<SortByName>();
builder.Services.AddScoped<SortByAge>();

// Controller receives all strategies via DI
[HttpGet]
public IActionResult GetUsers(
    [FromQuery] string sort = "name",
    [FromServices] IEnumerable<ISortStrategy> strategies)
{
    ISortStrategy strategy = sort switch
    {
        "age"  => strategies.OfType<SortByAge>().First(),
        _      => strategies.OfType<SortByName>().First()
    };
    return Ok(strategy.Sort(users));
}
```

> **Note:** In practice, a simple `switch` with `new` is fine for small apps. DI is preferred when strategies have their own dependencies (e.g., database access).

---

## 5. DTO (Data Transfer Object)

> Separates database entities from API response models.

```csharp
// ❌ Bad: exposing entity directly (leaks password hash, internal fields)
[HttpGet("{id}")]
public async Task<ActionResult<User>> GetUser(int id)
{
    return await _db.Users.FindAsync(id);
}

// ✅ Good: use DTO
public class UserDto
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Email { get; set; }
    // No PasswordHash, no InternalNotes...
}

[HttpGet("{id}")]
public async Task<ActionResult<UserDto>> GetUser(int id)
{
    var user = await _db.Users.FindAsync(id);
    return new UserDto
    {
        Id = user.Id,
        Name = user.Name,
        Email = user.Email
    };
}
```

---

## 📚 Further Reading

- [Refactoring Guru — Design Patterns](https://refactoring.guru/design-patterns)
- [Design Patterns in C# (YouTube — Nick Chapsas)](https://www.youtube.com/@nickchapsas)
- [Repository Pattern — Microsoft Docs](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/infrastructure-persistence-layer-design)

---

> **Tip:** Don't force design patterns everywhere. Use them when code becomes complex and hard to change. "Premature optimization is the root of all evil."
