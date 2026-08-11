// Domain/Comment.cs
namespace Backend.Domain;

public class Comment : BaseEntity
{
    public string Content { get; set; } = string.Empty;

    public int TaskId { get; set; }
    public TaskItem Task { get; set; } = null!;

    public int AuthorId { get; set; }
    public User Author { get; set; } = null!;
}
