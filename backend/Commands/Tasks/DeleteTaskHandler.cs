// Commands/Tasks/DeleteTaskHandler.cs

using Backend.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Backend.Commands.Tasks;

public class DeleteTaskHandler : IRequestHandler<DeleteTaskCommand, DeleteTaskResult>
{
    private readonly AppDbContext _db;

    public DeleteTaskHandler(AppDbContext db)
    {
        _db = db;
    }

    public async Task<DeleteTaskResult> Handle(DeleteTaskCommand req, CancellationToken ct)
    {
        var taskInfo = await _db.Tasks
            .AsNoTracking()
            .Where(t => t.Id == req.TaskId)
            .Select(t => new
            {
                t.Id,
                IsAuthorized = t.Project.CreatedById == req.CurrentUserId
                            || t.Project.Members.Any(m => m.UserId == req.CurrentUserId)
            })
            .FirstOrDefaultAsync(ct);

        if (taskInfo == null)
            return new DeleteTaskResult(false, false);

        if (!taskInfo.IsAuthorized)
            return new DeleteTaskResult(true, false);

        var task = await _db.Tasks.FindAsync([req.TaskId], ct);

        if (task == null)
            return new DeleteTaskResult(false, false); // Race condition

        _db.Tasks.Remove(task);

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateConcurrencyException)
        {
            // Task is deleted before SaveChanges
            return new DeleteTaskResult(false, false);
        }

        return new DeleteTaskResult(true, true);
    }
}
