// Commands/Tasks/UpdateTaskHandler.cs
// Pattern: auth-check first (cheap SELECT), then mutate entity, then save.

using AutoMapper;
using AutoMapper.QueryableExtensions;
using Backend.DTOs;
using Backend.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Backend.Commands.Tasks;

public class UpdateTaskHandler : IRequestHandler<UpdateTaskCommand, UpdateTaskResult>
{
    private readonly AppDbContext _db;
    private readonly IMapper _mapper;

    public UpdateTaskHandler(AppDbContext db, IMapper mapper)
    {
        _db = db;
        _mapper = mapper;
    }

    public async Task<UpdateTaskResult> Handle(UpdateTaskCommand req, CancellationToken ct)
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
        {
            return new UpdateTaskResult(false, false, false, null);
        }

        bool isOwner = taskInfo.ProjectOwnerId == req.CurrentUserId;
        bool isMember = taskInfo.MemberIds.Contains(req.CurrentUserId);
        if (!isOwner && !isMember)
        {
            return new UpdateTaskResult(true, false, false, null);
        }

        if (req.AssigneeId.HasValue)
        {
            bool assigneeIsOwner = taskInfo.ProjectOwnerId == req.AssigneeId.Value;
            bool assigneeIsMember = taskInfo.MemberIds.Contains(req.AssigneeId.Value);
            if (!assigneeIsOwner && !assigneeIsMember)
            {
                return new UpdateTaskResult(true, true, false, null);
            }
        }

        // Load the actual entity for mutation (second, targeted query)
        var task = await _db.Tasks.FindAsync([req.TaskId], ct);
        if (task is null)
            return new UpdateTaskResult(false, false, false, null);

        if (req.Title is not null) task.Title = req.Title;
        if (req.Description is not null) task.Description = req.Description;
        if (req.Priority.HasValue) task.Priority = req.Priority.Value;
        if (req.DueDate.HasValue) task.DueDate = req.DueDate;

        // AssigneeId requires special handling:
        //   - req.AssigneeId has a value  -> assign to that user
        //   - ClearAssignee is true       -> explicitly set to null (remove assignee)
        //   - neither                     -> leave unchanged
        if (req.AssigneeId.HasValue)
            task.AssigneeId = req.AssigneeId;
        else if (req.ClearAssignee)
            task.AssigneeId = null;

        await _db.SaveChangesAsync(ct);

        var dto = await _db.Tasks
            .Where(t => t.Id == req.TaskId)
            .ProjectTo<TaskDto>(_mapper.ConfigurationProvider)
            .FirstAsync(ct);

        return new UpdateTaskResult(true, true, true, dto);
    }
}
