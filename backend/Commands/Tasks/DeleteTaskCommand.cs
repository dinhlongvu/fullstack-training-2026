// Commands/Tasks/DeleteTaskCommand.cs
using MediatR;

namespace Backend.Commands.Tasks;

public record DeleteTaskCommand(
    int TaskId,
    int CurrentUserId
) : IRequest<DeleteTaskResult>;

public record DeleteTaskResult(
    bool IsTaskFound,
    bool IsAuthorized
);
