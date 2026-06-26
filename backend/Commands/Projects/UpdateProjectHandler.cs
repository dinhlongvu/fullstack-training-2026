// Commands/Projects/UpdateProjectHandler.cs

using AutoMapper;
using Backend.Domain;
using Backend.DTOs;
using Backend.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Backend.Commands.Projects;

public class UpdateProjectHandler : IRequestHandler<UpdateProjectCommand, UpdateProjectResult>
{
    private readonly AppDbContext _db;
    private readonly IMapper _mapper;

    public UpdateProjectHandler(AppDbContext db, IMapper mapper)
    {
        _db = db;
        _mapper = mapper;
    }

    public async Task<UpdateProjectResult> Handle(UpdateProjectCommand req, CancellationToken ct)
    {
        // 1. Fetch the project by ID.
        // NOTE: This is a Write operation (Command), MUST rely on EF Core Change Tracking
        // Only the Owner can update
        var project = await _db.Projects
            .FirstOrDefaultAsync(p => p.Id == req.ProjectId, ct);
        // when use FirstOrDefaultAsync, EF Core will track the entity (Change Tracker), allowing to update it later without needing to re-fetch it

        // 2. Handle 404 Not Found project boundary
        if (project == null)
        {
            return new UpdateProjectResult(false, false, null);
        }

        // 3. Handle 403 Forbidden boundary (Strictly Owner-only authorization)
        if (project.CreatedById != req.UserId)
        {
            return new UpdateProjectResult(true, false, null);
        }

        // 4. Update domain entity properties
        // EF Core Change Tracker automatically detects if values actually changed before executing SQL UPDATE.
        project.Name = req.Name;
        project.Description = req.Description;

        // 5. Commit changes to the database
        await _db.SaveChangesAsync(ct);

        // 6. Map the updated entity to DTO and return success
        var projectDto = _mapper.Map<ProjectDto>(project);
        return new UpdateProjectResult(true, true, projectDto);
    }
}
