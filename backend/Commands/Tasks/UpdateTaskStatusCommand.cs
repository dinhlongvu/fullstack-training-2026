// Commands/Tasks/UpdateTaskStatusCommand.cs
using Backend.DTOs;
using MediatR;

using DomainTaskStatus = Backend.Domain.TaskStatus;

namespace Backend.Commands.Tasks;

public record UpdateTaskStatusRequest
{
    public string? Status { get; init; }
}

public record UpdateTaskStatusCommand : IRequest<UpdateTaskStatusResult>
{
    public int TaskId { get; init; }
    public int CurrentUserId { get; init; }
    public DomainTaskStatus Status { get; init; }
}
public record UpdateTaskStatusResult(
    bool IsFound,
    bool IsAuthorized,
    TaskDto? Data
);
