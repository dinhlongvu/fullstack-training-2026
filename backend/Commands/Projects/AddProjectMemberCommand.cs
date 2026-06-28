// Commands/Projects/AddProjectMemberCommand.cs
// CQRS Command: Represents the request to add a new member to a project.

using MediatR;
using Backend.DTOs;

namespace Backend.Commands.Projects;

public record AddProjectMemberCommand(
    int ProjectId,
    int TargetUserId,
    int CurrentUserId
) : IRequest<AddProjectMemberResult>;

// Result wrapper to handle HTTP error codes like 404, 403 and 409 in the controller
public record AddProjectMemberResult(
    bool IsProjectFound,
    bool IsUserFound,
    bool IsAuthorized,
    bool IsAlreadyMember,
    ProjectMemberDto? Data
);
