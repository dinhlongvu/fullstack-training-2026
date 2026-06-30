// Commands/Tasks/CreateTaskCommand.cs

using Backend.Domain;
using Backend.DTOs;
using MediatR;

namespace Backend.Commands.Tasks;

public record CreateTaskCommand(
    int ProjectId,
    string Title,
    string Description,
    Priority Priority,
    DateTime? DueDate,
    int CurrentUserId,
    int? AssigneeId
) : IRequest<CreateTaskResult>;

public record CreateTaskResult(
    bool IsProjectFound,
    bool IsAuthorized,
    bool IsAssigneeValid,
    TaskDto? Data
);

// The DTO represents the actual JSON Body the Client sends to Swagger
public record CreateTaskRequest(
    string Title,
    string Description,
    Priority Priority,
    DateTime? DueDate,
    int? AssigneeId
);
