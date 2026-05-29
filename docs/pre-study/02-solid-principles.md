# 02 — SOLID Principles

SOLID is a set of 5 design principles that make code **maintainable, extensible, and testable**. Each principle comes with a C# example.

---

## S — Single Responsibility Principle

> A class should have **one and only one reason to change** (one job).

```csharp
// ❌ Bad: one class doing too many things
public class UserService
{
    public void Register(User user)
    {
        if (string.IsNullOrEmpty(user.Email)) throw ...;  // validation
        _dbContext.Users.Add(user);                        // data access
        _dbContext.SaveChanges();
        _emailSender.Send(user.Email, "Welcome!");         // email
        _logger.Log("User registered");                    // logging
    }
}

// ✅ Good: separate into focused classes
public class UserValidator { /* validation only */ }
public class UserRepository { /* data access only */ }
public class EmailService { /* email sending only */ }
public class UserService // orchestrates
{
    public void Register(User user)
    {
        _validator.Validate(user);
        _repository.Save(user);
        _emailService.SendWelcome(user.Email);
    }
}
```

---

## O — Open/Closed Principle

> Classes should be **open for extension, closed for modification**.

```csharp
// ❌ Bad: must edit code every time a new payment method is added
public decimal CalculateDiscount(string type, decimal amount)
{
    if (type == "VIP") return amount * 0.2m;
    if (type == "Member") return amount * 0.1m;
    return 0;
}

// ✅ Good: use interface + DI to extend without modifying
public interface IDiscountStrategy
{
    decimal Calculate(decimal amount);
}
public class VipDiscount : IDiscountStrategy
{
    public decimal Calculate(decimal amount) => amount * 0.2m;
}
public class MemberDiscount : IDiscountStrategy
{
    public decimal Calculate(decimal amount) => amount * 0.1m;
}
// Adding a new strategy → just create a new class, zero changes to existing code
```

---

## L — Liskov Substitution Principle

> Subclasses should be substitutable for their base class **without breaking logic**.

```csharp
// ❌ Bad: Square inherits Rectangle but breaks the expected behavior
public class Rectangle
{
    public virtual int Width { get; set; }
    public virtual int Height { get; set; }
    public int Area => Width * Height;
}
public class Square : Rectangle
{
    public override int Width
    {
        set { base.Width = base.Height = value; }
    }
    public override int Height
    {
        set { base.Width = base.Height = value; }
    }
}
// Bug: Square.Area = 25 when Width=5, Height=10 → WRONG!

// ✅ Good: use interfaces instead of inappropriate inheritance
public interface IShape { int Area { get; } }
public class Rectangle : IShape { ... }
public class Square : IShape { ... }
```

---

## I — Interface Segregation Principle

> Keep interfaces **small and focused** — clients shouldn't depend on methods they don't use.

```csharp
// ❌ Bad: one giant interface
public interface IWorker
{
    void Work();
    void Eat();
    void Sleep();
}
// Robot doesn't eat or sleep, but is forced to implement those

// ✅ Good: split into small interfaces
public interface IWorkable { void Work(); }
public interface IEatable { void Eat(); }
public interface ISleepable { void Sleep(); }

public class Human : IWorkable, IEatable, ISleepable { ... }
public class Robot : IWorkable { ... } // Only implements what it needs
```

---

## D — Dependency Inversion Principle

> Depend on **abstractions (interfaces)**, not concrete classes.

This is the most important principle in ASP.NET Core — it's the foundation of **Dependency Injection (DI)**:

```csharp
// ❌ Bad: UserService directly depends on SqlUserRepository
public class UserService
{
    private SqlUserRepository _repo = new SqlUserRepository();
    // Can't test without a real SQL Server!
}

// ✅ Good: depends on interface — uses DI
public interface IUserRepository
{
    User? GetById(int id);
}

public class UserService
{
    private readonly IUserRepository _repo;
    public UserService(IUserRepository repo) => _repo = repo;
    // Can inject a mock for testing, or switch to MongoDB without touching Service
}

// In Program.cs:
builder.Services.AddScoped<IUserRepository, SqlUserRepository>();
```

---

## 📚 Further Reading

- [Refactoring Guru — SOLID](https://refactoring.guru/design-patterns/solid)
- [SOLID Principles in C# (YouTube)](https://www.youtube.com/results?search_query=solid+principles+c%23)
- [Dependency Injection in ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/dependency-injection)

---

> **Tip:** When coding, always ask: "If I need to swap the database or add a new feature, do I have to modify existing code?" If yes → not SOLID yet!
