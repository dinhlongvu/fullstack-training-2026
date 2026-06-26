// Commands/Projects/UpdateProjectCommand.cs
// Update project name and description

using MediatR;
using Backend.DTOs;

namespace Backend.Commands.Projects;

public record UpdateProjectCommand(
    int ProjectId,
    string Name,
    string Description,
    int UserId
) : IRequest<UpdateProjectResult>;

// Result wrapper to gracefully handle 404 Not Found and 403 Forbidden control flows
public record UpdateProjectResult(bool IsFound, bool IsAuthorized, ProjectDto? Data);
