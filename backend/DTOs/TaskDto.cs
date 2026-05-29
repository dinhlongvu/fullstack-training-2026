// DTOs/TaskDto.cs
// DTO (Data Transfer Object) — what the API returns to the client.
// NEVER expose your Entity directly. Always map Entity → DTO.

namespace Backend.DTOs;

public record TaskDto(
    int Id,
    string Title,
    string Description,
    string Status,        // Enum → string: "Todo" | "InProgress" | "Done"
    string Priority,      // Enum → string: "Low" | "Medium" | "High"
    DateTime? DueDate,
    string? AssigneeName, // Flattened from TaskItem.Assignee.FullName
    int CommentCount,
    DateTime CreatedAt
);

// Separate DTO for list views (fewer fields = faster queries)
public record TaskSummaryDto(
    int Id,
    string Title,
    string Status,
    string Priority,
    string? AssigneeName
);
