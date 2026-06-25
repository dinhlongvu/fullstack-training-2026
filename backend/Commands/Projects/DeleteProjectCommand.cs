// Commands/Projects/DeleteProjectCommand.cs
// Delete project. Owner-only authorization. 
// Expects database-level cascade delete for all related ProjectMembers, Tasks, and Comments.

using MediatR;

namespace Backend.Commands.Projects;

public record DeleteProjectCommand(
    int ProjectId,
    int UserId
) : IRequest<DeleteProjectResult>;

// Result wrapper for control flow: 204 (Success), 404 (Not Found), 403 (Forbidden)
public record DeleteProjectResult(bool IsFound, bool IsAuthorized);
