// Commands/Projects/UpdateProjectCommand.cs
// Update project name and description

using Backend.DTOs;
using MediatR;

namespace Backend.Commands.Projects;

public record UpdateProjectCommand(
    int ProjectId,
    string Name,
    string Description,
    int UserId
) : IRequest<UpdateProjectResult>;

// Result wrapper to gracefully handle 404 Not Found and 403 Forbidden control flows
public record UpdateProjectResult(bool IsFound, bool IsAuthorized, ProjectDto? Data);

/// <summary>
/// Payload to update an existing project's details.
/// </summary>
public record UpdateProjectRequest
{
    /// <summary>The updated name of the project.</summary>
    /// <example>Updated Website Redesign</example>
    public string Name { get; init; } = string.Empty;

    /// <summary>Optional updated description of the project.</summary>
    /// <example>Now includes a mobile-first redesign.</example>
    public string? Description { get; init; }
}
