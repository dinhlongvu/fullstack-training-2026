// Infrastructure/Data/AppDbContext.cs
// DbContext = your gateway to the database.
// DbSet<T> properties ARE your repositories — no extra wrapper needed.
// EF Core translates LINQ queries to SQL automatically.

using Backend.Domain;
using Microsoft.EntityFrameworkCore;

namespace Backend.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    // Each DbSet = a repository for that entity
    public DbSet<User> Users => Set<User>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<ProjectMember> ProjectMembers => Set<ProjectMember>();
    public DbSet<TaskItem> Tasks => Set<TaskItem>();
    public DbSet<Comment> Comments => Set<Comment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Apply all configuration classes from this assembly
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}
