// Domain/ProjectMember.cs
namespace Backend.Domain;

public class ProjectMember
{
    public int Id { get; set; }
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

    public int ProjectId { get; set; }
    public Project Project { get; set; } = null!;

    public int UserId { get; set; }
    public User User { get; set; } = null!;
}
