// Commands/Tasks/UpdateTaskStatusCommand.cs
using Backend.Domain;
using Backend.DTOs;
using MediatR;

using DomainTaskStatus = Backend.Domain.TaskStatus;

namespace Backend.Commands.Tasks;

public record UpdateTaskStatusRequest(string? Status);

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
