// Commands/Tasks/CreateTaskHandler.cs

using AutoMapper;
using Backend.Domain;
using Backend.DTOs;
using Backend.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

// Change the alias to use Domain's Enum, not System's
using DomainTaskStatus = Backend.Domain.TaskStatus;

namespace Backend.Commands.Tasks;

public class CreateTaskHandler : IRequestHandler<CreateTaskCommand, CreateTaskResult>
{
    private readonly AppDbContext _db;
    private readonly IMapper _mapper;

    public CreateTaskHandler(AppDbContext db, IMapper mapper)
    {
        _db = db;
        _mapper = mapper;
    }

    public async Task<CreateTaskResult> Handle(CreateTaskCommand req, CancellationToken ct)
    {
        var projectInfo = await _db.Projects
            .Select(p => new
            {
                p.Id,
                p.CreatedById,
                MemberIds = p.Members.Select(m => m.UserId).ToList()
            })
            .FirstOrDefaultAsync(p => p.Id == req.ProjectId, ct);

        if (projectInfo == null)
        {
            return new CreateTaskResult(false, false, false, null);
        }

        // Must be owner or member
        bool isOwner = projectInfo.CreatedById == req.CurrentUserId;
        bool isMember = projectInfo.MemberIds.Contains(req.CurrentUserId);
        if (!isOwner && !isMember)
        {
            return new CreateTaskResult(true, false, false, null);
        }

        // Assignee must be owner or member
        if (req.AssigneeId.HasValue)
        {
            bool isAssigneeOwner = projectInfo.CreatedById == req.AssigneeId.Value;
            bool isAssigneeMember = projectInfo.MemberIds.Contains(req.AssigneeId.Value);

            if (!isAssigneeOwner && !isAssigneeMember)
            {
                return new CreateTaskResult(true, true, false, null);
            }
        }

        var newTask = new TaskItem
        {
            ProjectId = req.ProjectId,
            Title = req.Title,
            Description = req.Description,
            Priority = req.Priority,
            DueDate = req.DueDate,
            AssigneeId = req.AssigneeId,
            Status = DomainTaskStatus.Todo,
        };

        _db.Tasks.Add(newTask);
        await _db.SaveChangesAsync(ct);

        // Load the Assignee navigation property so that AutoMapper can get the AssigneeName
        if (newTask.AssigneeId.HasValue)
        {
            await _db.Entry(newTask).Reference(t => t.Assignee).LoadAsync(ct);
        }

        var taskDto = _mapper.Map<TaskDto>(newTask);

        return new CreateTaskResult(true, true, true, taskDto);
    }
}
