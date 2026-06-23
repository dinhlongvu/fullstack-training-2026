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
