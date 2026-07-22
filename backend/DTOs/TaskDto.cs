// DTOs/TaskDto.cs
// DTO (Data Transfer Object) — what the API returns to the client.
// NEVER expose your Entity directly. Always map Entity → DTO.

namespace Backend.DTOs;

public record TaskDto
{
    public int Id { get; init; }
    public int ProjectId { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;        // Enum -> string: "Todo" | "InProgress" | "Done"
    public string Priority { get; init; } = string.Empty;      // Enum -> string: "Low" | "Medium" | "High"
    public DateTime? DueDate { get; init; }
    public int? AssigneeId { get; init; }
    public string? AssigneeName { get; init; } // Flattened from TaskItem.Assignee.FullName
    public int CommentCount { get; init; }
    public DateTime CreatedAt { get; init; }
}

// Separate DTO for list views (fewer fields = faster queries)
public record TaskSummaryDto
{
    public int Id { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public string Priority { get; init; } = string.Empty;
    public int? AssigneeId { get; init; }
    public string? AssigneeName { get; init; }
}
