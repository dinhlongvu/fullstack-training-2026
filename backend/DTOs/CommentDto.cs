// DTOs/CommentDto.cs

namespace Backend.DTOs;

public record CommentDto
{
    public int Id { get; init; }
    public string Content { get; init; } = null!;

    public int AuthorId { get; init; }
    public string AuthorName { get; init; } = null!;

    public DateTime CreateAt { get; init; }
    public DateTime? UpdateAt { get; init; }
}
