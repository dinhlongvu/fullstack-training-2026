// Commands/Projects/DeleteProjectHandler.cs

using Backend.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Backend.Commands.Projects;

public class DeleteProjectHandler : IRequestHandler<DeleteProjectCommand, DeleteProjectResult>
{
    private readonly AppDbContext _db;

    public DeleteProjectHandler(AppDbContext db)
    {
        _db = db;
    }

    public async Task<DeleteProjectResult> Handle(DeleteProjectCommand req, CancellationToken ct)
    {
        // 1. Fetch the entity to ensure it is tracked by the EF Core Change Tracker.
        var project = await _db.Projects.FirstOrDefaultAsync(p => p.Id == req.ProjectId, ct);

        // 2. Handle 404 Not Found boundary
        if (project == null)
        {
            return new DeleteProjectResult(false, false);
        }

        // 3. Handle 403 Forbidden boundary (Strictly Owner-only)
        if (project.CreatedById != req.UserId)
        {
            return new DeleteProjectResult(true, false);
        }

        // 4. Mark the entity as Deleted in the Change Tracker
        _db.Projects.Remove(project);

        // 5. Commit changes to the database. 
        // Database will automatically handle Cascade Deletion for Tasks and ProjectMembers.
        await _db.SaveChangesAsync(ct);

        // 6. Return success (204 No Content mapped in the API endpoint)
        return new DeleteProjectResult(true, true);
    }
}
