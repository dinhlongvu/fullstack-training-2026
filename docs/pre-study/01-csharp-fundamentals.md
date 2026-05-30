# 01 — C# Fundamentals

## Overview

C# is a strongly-typed, object-oriented language running on the .NET runtime. It powers the entire backend of this project.

---

## 1. Value Types vs Reference Types

```csharp
// Value Type — stores the actual value directly
int a = 5;
int b = a;      // b = 5 (copy of value)
b = 10;         // a is still 5

// Reference Type — stores a pointer (address)
var user1 = new User { Name = "Alice" };
var user2 = user1;      // user2 points to the SAME object
user2.Name = "Bob";     // user1.Name is now "Bob" too!

// ⚠️ Key rule: struct = value type, class = reference type
```

**Value Types:** `int`, `double`, `bool`, `char`, `DateTime`, `struct`, `enum`
**Reference Types:** `string` (special — see below), `class`, `interface`, `delegate`, `array`, `List<T>`

> **Why is `string` a reference type but behaves like a value type?** Strings are **immutable** — every "modification" creates a new string object. `string a = "Hello"; a += " World";` doesn't modify the original string; it creates a new one. This is why `string` often *feels* like a value type even though it's stored on the heap. The same goes for `DateTime` (which is actually a value type — a `struct`).

---

## 2. LINQ (Language Integrated Query)

LINQ lets you query collections with clean, readable syntax:

```csharp
var users = new List<User>
{
    new() { Name = "Alice", Age = 22, City = "Da Lat" },
    new() { Name = "Bob",   Age = 23, City = "Saigon" },
    new() { Name = "Carol", Age = 21, City = "Da Lat" }
};

// Method syntax (preferred)
var dalatUsers = users.Where(u => u.City == "Da Lat");
var names = users.Select(u => u.Name);           // ["Alice", "Bob", "Carol"]
var first = users.FirstOrDefault(u => u.Age > 25); // null
var sorted = users.OrderBy(u => u.Age);
var hasAdult = users.Any(u => u.Age >= 18);       // true
var avgAge = users.Average(u => u.Age);           // 22

// Query syntax (SQL-like)
var result = from u in users
             where u.City == "Da Lat"
             orderby u.Age
             select u.Name;
```

---

## 3. Async/Await

Async prevents blocking the thread when waiting for I/O (database, API calls, file reads):

```csharp
// ❌ Bad — synchronous, blocks the thread
public User GetUser(int id)
{
    return _dbContext.Users.Find(id);
}

// ✅ Good — async, doesn't block
public async Task<User?> GetUserAsync(int id)
{
    return await _dbContext.Users.FindAsync(id);
}

// Running multiple async operations concurrently
var task1 = GetUserAsync(1);
var task2 = GetUserAsync(2);
var results = await Task.WhenAll(task1, task2); // runs in parallel

// ⚠️ Rule: if a method uses await, declare it async Task<T>
// ⚠️ Avoid: async void (only for event handlers)
// ⚠️ Avoid: .Result or .Wait() (causes deadlocks)
```

---

## 4. Exception Handling

```csharp
try
{
    var user = await _service.GetUserAsync(id);
    if (user == null)
        return NotFound();  // 404
    return Ok(user);        // 200
}
catch (DbUpdateException ex)
{
    _logger.LogError(ex, "Database error fetching user {Id}", id);
    return StatusCode(500, "Internal server error");
}
catch (Exception ex)
{
    _logger.LogError(ex, "Unexpected error");
    throw; // rethrow if you can't handle it
}
```

**Principles:**
- Only catch exceptions you **can actually handle**
- Always log exceptions (never swallow silently)
- Don't catch `Exception` everywhere — only at top level (controllers)

---

## 5. Properties & Auto-Properties

```csharp
public class User
{
    // Auto-property (short and clean)
    public int Id { get; set; }
    public string Name { get; set; }

    // Read-only property
    public DateTime CreatedAt { get; } = DateTime.UtcNow;

    // Computed property
    public string DisplayName => $"{Name} (#{Id})";

    // Property with validation
    private int _age;
    public int Age
    {
        get => _age;
        set => _age = value >= 0 ? value : throw new ArgumentException();
    }
}
```

---

## 6. Nullable Reference Types (NRT)

C# 8+ enables nullable reference types by default in new projects. This helps catch null-reference bugs at compile time:

```csharp
// With NRT enabled (<Nullable>enable</Nullable> in .csproj):
public class User
{
    public string Name { get; set; }       // ⚠️ Warning: non-nullable, must be initialized
    public string? Nickname { get; set; }  // ✅ May be null — the '?' tells the compiler
}

// Working with nullable types safely:
public string GetDisplayName(User user)
{
    // Null-coalescing operator
    return user.Nickname ?? user.Name;
}

// Null-conditional operator
int? length = user.Nickname?.Length;  // null if Nickname is null
```

**Rule of thumb:** Use `?` for anything that can legitimately be null. Don't use `?` for required fields.

---

## 7. Records (C# 9+)

Records are immutable reference types — perfect for DTOs, commands, and queries. This project uses records extensively in CQRS:

```csharp
// Record = short, immutable, value-equality
public record TaskDto(int Id, string Title, string Status);

// Record with explicit properties (for JSON serialization)
public record CreateTaskCommand
{
    public string Title { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public Priority Priority { get; init; }
}

// With-expression: create a copy with one field changed
var cmd = new CreateTaskCommand { Title = "Hello", Priority = Priority.High };
var updated = cmd with { Title = "Updated" }; // Priority stays High, Title changes
```

**Records vs Classes:**
| Feature | `record` | `class` |
|---------|----------|---------|
| Equality | Value-based (compares all properties) | Reference-based (compares memory address) |
| Mutability | Immutable by default (`init` only) | Mutable (`get; set;`) |
| `ToString()` | Auto-generated (shows all properties) | Default (shows type name) |
| Use for | DTOs, Commands, Queries | Entities, Services, DbContext |

Our CQRS pattern: **Commands and Queries = records, Entities = classes.**

---

## 📚 Further Reading

- [Microsoft Learn — C# Fundamentals](https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/)
- [LINQ 101 Samples](https://learn.microsoft.com/en-us/samples/dotnet/try-samples/101-linq-samples/)
- [Async/Await Best Practices](https://learn.microsoft.com/en-us/archive/msdn-magazine/2013/march/async-await-best-practices-in-asynchronous-programming)
- [C# Coding Conventions](https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/coding-style/coding-conventions)

---

> **Tip:** After reading this, try writing a small console app using LINQ + async/await to build muscle memory!
