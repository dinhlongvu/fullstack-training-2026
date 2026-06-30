// Commands/Tasks/CreateTask.cs
using AutoMapper;
using Backend.Domain;
using Backend.DTOs;
using Backend.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

using DomainTaskStatus = Backend.Domain.TaskStatus;
namespace Backend.Commands.Tasks;

public record CreateTaskRequest(
    string Title,
    string Description,
    Priority Priority,
    DateTime? DueDate,
    int? AssigneeId
);

public record CreateTaskCommand(
    int ProjectId,
    string Title,
    string Description,
    Priority Priority,
    DateTime? DueDate,
    int CurrentUserId,
    int? AssigneeId
) : IRequest<CreateTaskResult>;

public record CreateTaskResult(
    bool IsProjectFound,
    bool IsAuthorized,
    bool IsAssigneeValid,
    TaskDto? Data
);

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
        var project = await _db.Projects
            .Include(p => p.Members)
            .FirstOrDefaultAsync(p => p.Id == req.ProjectId, ct);

        if (project == null)
        {
            return new CreateTaskResult(false, false, false, null);
        }

        // Must be owner or member
        bool isOwner = project.CreatedById == req.CurrentUserId;
        bool isMember = project.Members.Any(m => m.UserId == req.CurrentUserId);

        if (!isOwner && !isMember)
        {
            return new CreateTaskResult(true, false, false, null);
        }

        // Assignee must be owner or member
        if (req.AssigneeId.HasValue)
        {
            bool isAssigneeOwner = project.CreatedById == req.AssigneeId.Value;
            bool isAssigneeMember = project.Members.Any(m => m.UserId == req.AssigneeId.Value);

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
            Status = DomainTaskStatus.Todo
        };

        _db.Tasks.Add(newTask);
        await _db.SaveChangesAsync(ct);

        var taskDto = _mapper.Map<TaskDto>(newTask);
        return new CreateTaskResult(true, true, true, taskDto);
    }
}
