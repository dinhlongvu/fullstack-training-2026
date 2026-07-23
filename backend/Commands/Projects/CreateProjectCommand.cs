// Commands/Projects/CreateProjectCommand.cs
// Carries data from the HTTP request and the authenticated user's ID.

using Backend.DTOs;
using MediatR;

namespace Backend.Commands.Projects;

public record CreateProjectCommand(
    string Name,
    string Description,
    int UserId
) : IRequest<ProjectDto>;

/// <summary>
/// Payload to create a new project.
/// </summary>
public record CreateProjectRequest
{
    /// <summary>The name of the project.</summary>
    /// <example>Website Redesign</example>
    public string Name { get; init; } = string.Empty;

    /// <summary>Optional detailed description of the project.</summary>
    /// <example>Redesigning the corporate website using React.</example>
    public string? Description { get; init; }
}
