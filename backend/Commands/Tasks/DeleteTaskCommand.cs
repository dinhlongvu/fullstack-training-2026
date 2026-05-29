// Commands/Tasks/DeleteTaskCommand.cs
using MediatR;

namespace Backend.Commands.Tasks;

public record DeleteTaskCommand(int TaskId) : IRequest;

// Note: Handler not yet implemented — intern will complete this.
