// Commands/Tasks/AssignTaskCommand.cs

using Backend.DTOs;
using MediatR;

namespace Backend.Commands.Tasks;

/// <summary>
/// Request payload to assign or unassign a task to a project member.
/// </summary>
public record AssignTaskRequest
{
    /// <summary>The ID of the project member to assign. Send null to unassign.</summary>
    /// <example>1</example>
    public int? AssigneeId { get; init; }
}

public record AssignTaskCommand(
    int TaskId,
    int CurrentUserId,
    int? AssigneeId
) : IRequest<AssignTaskResult>;

public record AssignTaskResult(
    bool IsFound,
    bool IsAuthorized,
    bool IsAssigneeValid,
    TaskDto? Data
);
