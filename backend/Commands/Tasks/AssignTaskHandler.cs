// Commands/Tasks/AssignTaskHandler.cs

using AutoMapper;
using AutoMapper.QueryableExtensions;
using Backend.DTOs;
using Backend.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Backend.Commands.Tasks;

public class AssignTaskHandler : IRequestHandler<AssignTaskCommand, AssignTaskResult>
{
    private readonly AppDbContext _db;
    private readonly IMapper _mapper;

    public AssignTaskHandler(AppDbContext db, IMapper mapper)
    {
        _db = db;
        _mapper = mapper;
    }

    public async Task<AssignTaskResult> Handle(AssignTaskCommand req, CancellationToken ct)
    {
        // Only retrieve check flags (valid permissions + assignee), avoid loading full entities
        var taskInfo = await _db.Tasks
            .AsNoTracking()
            .Where(t => t.Id == req.TaskId)
            .Select(t => new
            {
                t.Id,
                IsAuthorized = t.Project.CreatedById == req.CurrentUserId ||
                               t.Project.Members.Any(m => m.UserId == req.CurrentUserId),

                IsAssigneeValid = req.AssigneeId == null ||
                                  t.Project.CreatedById == req.AssigneeId.Value ||
                                  t.Project.Members.Any(m => m.UserId == req.AssigneeId.Value)
            })
            .FirstOrDefaultAsync(ct);

        if (taskInfo == null)
            return new AssignTaskResult(false, false, false, null);

        if (!taskInfo.IsAuthorized)
            return new AssignTaskResult(true, false, false, null);

        if (!taskInfo.IsAssigneeValid)
            return new AssignTaskResult(true, true, false, null);

        // Update DB and catch error of task being deleted
        var affectedRows = await _db.Tasks
            .Where(t => t.Id == req.TaskId)
            .ExecuteUpdateAsync(
                s => s
                    .SetProperty(t => t.AssigneeId, req.AssigneeId)
                    .SetProperty(t => t.UpdatedAt, DateTime.UtcNow),
                ct);

        if (affectedRows == 0)
            return new AssignTaskResult(false, false, false, null);

        // Use FirstOrDefaultAsync instead of FirstAsync to avoid 500 error if the task was deleted in the meantime
        var dto = await _db.Tasks
            .Where(t => t.Id == req.TaskId)
            .ProjectTo<TaskDto>(_mapper.ConfigurationProvider)
            .FirstOrDefaultAsync(ct);

        if (dto == null)
            return new AssignTaskResult(false, false, false, null);

        return new AssignTaskResult(true, true, true, dto);
    }
}
