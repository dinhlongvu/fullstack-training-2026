// Domain/Project.cs
namespace Backend.Domain;

public class Project : IAuditableEntity // Implements IAuditableEntity to opt-in for automatic timestamp tracking
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;

    // Automatically managed by AuditableEntityInterceptor
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public int CreatedById { get; set; }
    public User CreatedBy { get; set; } = null!;

    public ICollection<ProjectMember> Members { get; set; } = new List<ProjectMember>();
    public ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();
}
