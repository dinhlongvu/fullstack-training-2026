// Commands/Projects/AddProjectMemberHandler.cs
// Implements the business logic for adding a user to a project's member list.

using AutoMapper;
using Backend.Domain;
using Backend.DTOs;
using Backend.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Backend.Commands.Projects;

public class AddProjectMemberHandler : IRequestHandler<AddProjectMemberCommand, AddProjectMemberResult>
{
    private readonly AppDbContext _db;
    private readonly IMapper _mapper;

    public AddProjectMemberHandler(AppDbContext db, IMapper mapper)
    {
        _db = db;
        _mapper = mapper;
    }

    public async Task<AddProjectMemberResult> Handle(AddProjectMemberCommand req, CancellationToken ct)
    {
        // 1. Fetch the project along with its current members to check for duplicates later
        var project = await _db.Projects
            .Include(p => p.Members)
            .FirstOrDefaultAsync(p => p.Id == req.ProjectId, ct);

        // 2. Handle 404 Not Found (Project)
        if (project == null)
        {
            return new AddProjectMemberResult(false, false, false, false, null);
        }

        // 3. Handle 403 Forbidden (Strictly Owner-only authorization)
        if (project.CreatedById != req.CurrentUserId)
        {
            return new AddProjectMemberResult(true, true, false, false, null);
        }

        // 4. Fetch the target user to ensure they exist
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == req.TargetUserId, ct);

        // 5. Handle 404 Not Found (User)
        if (user == null)
        {
            return new AddProjectMemberResult(true, false, true, false, null);
        }

        // 6. Handle 409 Conflict (User is already a member)
        if (project.Members.Any(m => m.UserId == req.TargetUserId))
        {
            return new AddProjectMemberResult(true, true, true, true, null);
        }

        // 7. Create the new ProjectMember entity
        var newProjectMember = new ProjectMember
        {
            ProjectId = req.ProjectId,
            UserId = req.TargetUserId,
            JoinedAt = DateTime.UtcNow,
            User = user // Attach the fetched user entity so AutoMapper can resolve Email and FullName
        };

        _db.ProjectMembers.Add(newProjectMember);

        // 8. Commit changes to the database
        await _db.SaveChangesAsync(ct);

        // 9. Map entity to DTO and return success
        var projectMemberDto = _mapper.Map<ProjectMemberDto>(newProjectMember);

        return new AddProjectMemberResult(true, true, true, false, projectMemberDto);
    }
}
