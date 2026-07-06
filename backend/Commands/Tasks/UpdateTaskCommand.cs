// Commands/Tasks/UpdateTaskCommand.cs

using Backend.Domain;
using Backend.DTOs;
using MediatR;

namespace Backend.Commands.Tasks;

public record UpdateTaskCommand(
    int TaskId,
    int CurrentUserId,
    // Nullable = optional; null means "caller did not send this field"
    string? Title,
    string? Description,
    Priority? Priority,
    DateTime? DueDate,
    int? AssigneeId,
    bool ClearAssignee  // true when caller explicitly wants to remove assignee
) : IRequest<UpdateTaskResult>;

public record UpdateTaskResult(
    bool IsFound,
    bool IsAuthorized,
    bool IsAssigneeValid,
    TaskDto? Data
);

public record UpdateTaskRequest
{
    public string? Title { get; init; }
    public string? Description { get; init; }
    public string? Priority { get; init; }
    public DateTime? DueDate { get; init; }
    public int? AssigneeId { get; init; }

    // Default false — only true when caller explicitly sends "clearAssignee": true
    public bool ClearAssignee { get; init; } = false;
}
