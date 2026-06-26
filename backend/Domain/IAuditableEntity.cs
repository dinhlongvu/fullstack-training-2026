// Domain/IAuditableEntity.cs
// Defines the contract for entities that require automatic audit timestamps
// The interceptor will filter entities based on this interface

namespace Backend.Domain;

public interface IAuditableEntity
{
    // The timestamp when the record was initially created
    DateTime CreatedAt { get; set; }

    // The timestamp when the record was last updated
    DateTime UpdatedAt { get; set; }
}
