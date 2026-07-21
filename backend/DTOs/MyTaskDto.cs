// DTOs/MyTaskDto.cs

namespace Backend.DTOs;

public record MyTaskDto(
    int Id,
    string Title,
    string Description,
    int Status,
    int Priority,
    DateTime? DueDate,
    int ProjectId,
    int? AssigneeId
);
