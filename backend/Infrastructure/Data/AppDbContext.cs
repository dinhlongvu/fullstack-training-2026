// Infrastructure/Data/AppDbContext.cs
// DbContext = your gateway to the database.
// DbSet<T> properties ARE your repositories — no extra wrapper needed.
// EF Core translates LINQ queries to SQL automatically.

using Backend.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Backend.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    // Each DbSet = a repository for that entity
    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>(); // Register RefreshToken DbSet here
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<ProjectMember> ProjectMembers => Set<ProjectMember>();
    public DbSet<TaskItem> Tasks => Set<TaskItem>();
    public DbSet<Comment> Comments => Set<Comment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Apply all configuration classes from this assembly
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // SQLite loses DateTimeKind on read; re-attach Utc so JSON serializes audit timestamps with "Z".
        // DueDate is intentionally excluded — the FE treats it as local time.
        var utcConverter = new ValueConverter<DateTime, DateTime>(
            v => v,
            v => DateTime.SpecifyKind(v, DateTimeKind.Utc));
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                if (property.ClrType == typeof(DateTime)
                    && property.Name is "CreatedAt" or "UpdatedAt" or "JoinedAt")
                {
                    property.SetValueConverter(utcConverter);
                }
            }
        }
    }
}
