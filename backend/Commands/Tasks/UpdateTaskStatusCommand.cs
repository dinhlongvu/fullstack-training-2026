// Commands/Tasks/UpdateTaskStatusCommand.cs
using Backend.Domain;
using MediatR;

namespace Backend.Commands.Tasks;

public record UpdateTaskStatusCommand : IRequest
{
    public int TaskId { get; init; }
    public Domain.TaskStatus Status { get; init; }
}

// Note: Handler not yet implemented — intern will complete this.
