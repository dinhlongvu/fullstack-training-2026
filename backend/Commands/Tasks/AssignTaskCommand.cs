// Commands/Tasks/AssignTaskCommand.cs

using Backend.DTOs;
using MediatR;

namespace Backend.Commands.Tasks;

public record AssignTaskRequest(int? AssigneeId);

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
