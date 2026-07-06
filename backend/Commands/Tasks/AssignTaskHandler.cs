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
        // forces SQL Server to calculate and return only 2 bool variables
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
                s => s.SetProperty(t => t.AssigneeId, req.AssigneeId),
                ct);

        // If = 0 means the task was deleted before the UPDATE command arrived
        if (affectedRows == 0)
            return new AssignTaskResult(false, false, false, null);

        var dto = await _db.Tasks
            .Where(t => t.Id == req.TaskId)
            .ProjectTo<TaskDto>(_mapper.ConfigurationProvider)
            .FirstAsync(ct);

        return new AssignTaskResult(true, true, true, dto);
    }
}
