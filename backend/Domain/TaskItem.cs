// Domain/TaskItem.cs
// Entity class — maps to [Tasks] table in SQL Server
// One file per entity. Navigation properties define relationships.

namespace Backend.Domain;

public enum TaskStatus { Todo, InProgress, Done }
public enum Priority { Low, Medium, High }

public class TaskItem
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public TaskStatus Status { get; set; } = TaskStatus.Todo;
    public Priority Priority { get; set; } = Priority.Medium;
    public DateTime? DueDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Foreign keys
    public int ProjectId { get; set; }
    public int? AssigneeId { get; set; }

    // Navigation properties (EF Core uses these for JOINs)
    public Project Project { get; set; } = null!;
    public User? Assignee { get; set; }
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
}
