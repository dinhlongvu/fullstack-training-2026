// Commands/Tasks/UpdateTaskStatusHandler.cs

using AutoMapper;
using AutoMapper.QueryableExtensions;
using Backend.DTOs;
using Backend.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Backend.Commands.Tasks;

public class UpdateTaskStatusHandler : IRequestHandler<UpdateTaskStatusCommand, UpdateTaskStatusResult>
{
    private readonly AppDbContext _db;
    private readonly IMapper _mapper;

    public UpdateTaskStatusHandler(AppDbContext db, IMapper mapper)
    {
        _db = db;
        _mapper = mapper;
    }

    public async Task<UpdateTaskStatusResult> Handle(UpdateTaskStatusCommand req, CancellationToken ct)
    {
        var taskInfo = await _db.Tasks
            .Where(t => t.Id == req.TaskId)
            .Select(t => new
            {
                t.Id,
                ProjectOwnerId = t.Project.CreatedById,
                MemberIds = t.Project.Members.Select(m => m.UserId).ToList()
            })
            .FirstOrDefaultAsync(ct);

        if (taskInfo == null)
            return new UpdateTaskStatusResult(false, false, null);

        bool isOwner = taskInfo.ProjectOwnerId == req.CurrentUserId;
        bool isMember = taskInfo.MemberIds.Contains(req.CurrentUserId);
        if (!isOwner && !isMember)
            return new UpdateTaskStatusResult(true, false, null);

        // Check for null to handle the race condition
        var task = await _db.Tasks.FindAsync([req.TaskId], ct);
        if (task == null)
            return new UpdateTaskStatusResult(false, false, null);

        task.Status = req.Status;
        await _db.SaveChangesAsync(ct);

        // Re-project from DB
        var dto = await _db.Tasks
            .Where(t => t.Id == req.TaskId)
            .ProjectTo<TaskDto>(_mapper.ConfigurationProvider)
            .FirstAsync(ct);

        return new UpdateTaskStatusResult(true, true, dto);
    }
}
