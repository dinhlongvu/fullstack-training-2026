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
        var taskInfo = await _db.Tasks
            .AsNoTracking()
            .Where(t => t.Id == req.TaskId)
            .Select(t => new
            {
                t.Id,
                ProjectOwnerId = t.Project.CreatedById,
                MemberIds = t.Project.Members.Select(m => m.UserId).ToList()
            })
            .FirstOrDefaultAsync(ct);

        if (taskInfo == null)
            return new AssignTaskResult(false, false, false, null);

        bool isOwner = taskInfo.ProjectOwnerId == req.CurrentUserId;
        bool isMember = taskInfo.MemberIds.Contains(req.CurrentUserId);

        if (!isOwner && !isMember)
            return new AssignTaskResult(true, false, false, null);

        if (req.AssigneeId.HasValue)
        {
            bool assigneeIsOwner = taskInfo.ProjectOwnerId == req.AssigneeId.Value;
            bool assigneeIsMember = taskInfo.MemberIds.Contains(req.AssigneeId.Value);

            if (!assigneeIsOwner && !assigneeIsMember)
                return new AssignTaskResult(true, true, false, null);
        }

        // Update DB with ExecuteUpdateAsync does not consume tracking entity memory
        await _db.Tasks
            .Where(t => t.Id == req.TaskId)
            .ExecuteUpdateAsync(
                s => s.SetProperty(t => t.AssigneeId, req.AssigneeId),
                ct);

        var dto = await _db.Tasks
            .Where(t => t.Id == req.TaskId)
            .ProjectTo<TaskDto>(_mapper.ConfigurationProvider)
            .FirstAsync(ct);
        return new AssignTaskResult(true, true, true, dto);
    }
}
