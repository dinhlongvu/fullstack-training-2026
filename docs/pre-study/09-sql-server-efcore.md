# 09 — SQL Server & Entity Framework Core

## Concept

**SQL Server** is a relational database — data is stored in tables with rows and columns, connected by relationships.

**Entity Framework Core (EF Core)** is an ORM (Object-Relational Mapper) — it lets you work with databases using C# objects instead of writing raw SQL. You write LINQ queries, EF Core translates them to SQL.

```
Your C# Code  →  EF Core (LINQ → SQL)  →  SQL Server
Task task = db.Tasks.Find(42);
// EF Core generates: SELECT * FROM Tasks WHERE Id = 42
```

## Code Examples

### Entity Classes (Models)

```csharp
// Domain/Entities/Project.cs
public class Project
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public ProjectStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }

    // Navigation properties
    public int CreatedById { get; set; }
    public User CreatedBy { get; set; } = null!;
    public ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();
}

public enum ProjectStatus
{
    Active,
    Archived
}
```

### DbContext (Database Gateway)

```csharp
// Infrastructure/Data/AppDbContext.cs
public class AppDbContext : DbContext
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<TaskItem> Tasks => Set<TaskItem>();
    public DbSet<Comment> Comments => Set<Comment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Configure relationships
        modelBuilder.Entity<TaskItem>()
            .HasOne(t => t.Project)
            .WithMany(p => p.Tasks)
            .HasForeignKey(t => t.ProjectId);

        // Configure indexes
        modelBuilder.Entity<TaskItem>()
            .HasIndex(t => t.Status);
    }
}
```

### Common Queries (LINQ)

```csharp
// Get by ID
var task = await db.Tasks.FindAsync(taskId);

// Filter + sort
var openTasks = await db.Tasks
    .Where(t => t.Status == TaskStatus.InProgress)
    .OrderByDescending(t => t.CreatedAt)
    .ToListAsync();

// Include related data (JOIN)
var taskWithComments = await db.Tasks
    .Include(t => t.Comments)
    .Include(t => t.Assignee)
    .FirstOrDefaultAsync(t => t.Id == taskId);

// Projection (select specific fields)
var summaries = await db.Tasks
    .Select(t => new TaskSummaryDto
    {
        Id = t.Id,
        Title = t.Title,
        AssigneeName = t.Assignee!.FullName
    })
    .ToListAsync();

// Pagination
var page = await db.Tasks
    .Where(t => t.ProjectId == projectId)
    .Skip((pageNumber - 1) * pageSize)
    .Take(pageSize)
    .ToListAsync();
```

### Migrations

```bash
# After changing your entity classes, create a migration:
dotnet ef migrations add AddTaskTagsTable

# Apply to database:
dotnet ef database update

# Rollback last migration:
dotnet ef database update PreviousMigrationName
```

## Key Rules

- 🟢 **Use navigation properties** — EF Core handles JOINs for you
- 🟢 **Always use async methods**: `ToListAsync()`, `FirstOrDefaultAsync()`, `SaveChangesAsync()`
- 🟢 **Use `.Select()` for projections** — don't fetch entire entities if you only need 3 fields
- 🟢 **Watch for N+1 queries** — use `.Include()` to eager-load related data
- 🟡 **Add indexes** on columns you frequently filter/sort by
- 🟡 **Connection strings belong in `appsettings.json`** (or User Secrets in dev), never hardcoded
- 🔴 **Never use string concatenation for SQL** — always use LINQ or parameterized queries

## N+1 Query Problem

```csharp
// ❌ N+1: 1 query for tasks + N queries for each assignee
var tasks = await db.Tasks.ToListAsync();
foreach (var task in tasks)
{
    Console.WriteLine(task.Assignee?.Name); // Triggers extra query!
}

// ✅ Single query with Include
var tasks = await db.Tasks
    .Include(t => t.Assignee)
    .ToListAsync();
```

## 📚 Further Reading

- [EF Core Documentation](https://learn.microsoft.com/en-us/ef/core/) — official docs
- [SQLBolt](https://sqlbolt.com/) — interactive SQL tutorial
- [LINQPad](https://www.linqpad.net/) — test LINQ queries instantly
- [EF Core Power Tools](https://github.com/ErikEJ/EFCorePowerTools) — visualize your database

## 💡 Tip

> EF Core is powerful but it's still generating SQL underneath. When in doubt, enable logging (`optionsBuilder.LogTo(Console.WriteLine)`) to see the actual SQL queries — it's the fastest way to catch N+1 problems and inefficient queries.
