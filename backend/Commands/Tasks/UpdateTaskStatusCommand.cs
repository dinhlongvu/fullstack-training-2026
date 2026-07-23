// Commands/Tasks/UpdateTaskStatusCommand.cs
using Backend.Domain;
using Backend.DTOs;
using MediatR;

using DomainTaskStatus = Backend.Domain.TaskStatus;

namespace Backend.Commands.Tasks;

/// <summary>
/// Request payload to update the status of a task.
/// </summary>
public record UpdateTaskStatusRequest
{
    /// <summary>The new status of the task. Accepted values: Todo, InProgress, Done.</summary>
    /// <example>InProgress</example>
    public string? Status { get; init; }
}

public record UpdateTaskStatusCommand(
    int TaskId,
    int CurrentUserId,
    DomainTaskStatus Status
) : IRequest<UpdateTaskStatusResult>;

public record UpdateTaskStatusResult(
    bool IsFound,
    bool IsAuthorized,
    TaskDto? Data
);
