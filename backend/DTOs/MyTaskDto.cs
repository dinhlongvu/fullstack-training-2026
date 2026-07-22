// DTOs/MyTaskDto.cs

namespace Backend.DTOs;

public record MyTaskDto(
    int Id,
    string Title,
    string Description,
    string Status,
    string Priority,
    DateTime? DueDate,
    int ProjectId,
    int? AssigneeId
);
