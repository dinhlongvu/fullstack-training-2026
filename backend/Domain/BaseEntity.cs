// Domain/BaseEntity.cs
// Abstract base class for all auditable domain entities.
// Centralizes Id, CreatedAt, and UpdatedAt so they are not repeated in every entity.

namespace Backend.Domain;

public abstract class BaseEntity : IAuditableEntity
{
    public int Id { get; set; }

    // Automatically managed by AuditableEntityInterceptor
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
