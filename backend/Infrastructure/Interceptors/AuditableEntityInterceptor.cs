// Infrastructure/Interceptors/AuditableEntityInterceptor.cs

using Backend.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace Backend.Infrastructure.Interceptors;

// Intercepts EF Core SaveChanges operations to automatically set CreatedAt and UpdatedAt properties.
public class AuditableEntityInterceptor : SaveChangesInterceptor
{
    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        var dbContext = eventData.Context;

        // If the context is null, bypass the interceptor and proceed normally.
        if (dbContext == null)
        {
            return base.SavingChangesAsync(eventData, result, cancellationToken);
        }

        // Retrieve all tracked entities that implement IAuditableEntity and have been modified or added.
        var entries = dbContext.ChangeTracker.Entries<IAuditableEntity>();

        // Capture a single UTC timestamp to ensure consistency across all entities in the transaction.
        var utcNow = DateTime.UtcNow;

        foreach (var entry in entries)
        {
            if (entry.State == EntityState.Added)
            {
                // Set both timestamps for newly created records.
                entry.Entity.CreatedAt = utcNow;
                entry.Entity.UpdatedAt = utcNow;
            }
            else if (entry.State == EntityState.Modified)
            {
                // Update only the UpdatedAt timestamp for modified records.
                entry.Entity.UpdatedAt = utcNow;
            }
        }

        // Continue with the standard EF Core SaveChanges pipeline.
        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }
}
