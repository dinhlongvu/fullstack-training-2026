// Commands/Projects/AddProjectMemberHandler.cs

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
        var projectInfo = await _db.Projects
            .AsNoTracking()
            .Select(p => new { p.Id, p.CreatedById })
            .FirstOrDefaultAsync(p => p.Id == req.ProjectId, ct);

        if (projectInfo == null)
        {
            return new AddProjectMemberResult(false, false, false, false, null);
        }

        if (projectInfo.CreatedById != req.CurrentUserId)
        {
            return new AddProjectMemberResult(true, true, false, false, null);
        }

        // Process the string in C# RAM before stuffing it into the Query so EF Core doesn't have to translate
        string normalizedEmail = req.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == normalizedEmail, ct);

        if (user == null)
        {
            return new AddProjectMemberResult(true, false, true, false, null);
        }

        bool isAlreadyMember = await _db.ProjectMembers
            .AnyAsync(m => m.ProjectId == req.ProjectId && m.UserId == user.Id, ct);

        if (isAlreadyMember)
        {
            return new AddProjectMemberResult(true, true, true, true, null);
        }

        var newProjectMember = new ProjectMember
        {
            ProjectId = req.ProjectId,
            UserId = user.Id,
            JoinedAt = DateTime.UtcNow,
            User = user
        };

        _db.ProjectMembers.Add(newProjectMember);
        await _db.SaveChangesAsync(ct);
        var projectMemberDto = _mapper.Map<ProjectMemberDto>(newProjectMember);
        return new AddProjectMemberResult(true, true, true, false, projectMemberDto);
    }
}
