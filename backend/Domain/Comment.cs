// Domain/Comment.cs
namespace Backend.Domain;

public class Comment
{
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public int TaskId { get; set; }
    public TaskItem Task { get; set; } = null!;

    public int AuthorId { get; set; }
    public User Author { get; set; } = null!;
}
