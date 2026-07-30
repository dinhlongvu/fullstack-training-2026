// Queries/Tasks/GetTasks.cs
// CQRS Query — 1 file = Query record + Result record + Handler class.
// Queries only READ data — no side effects, no SaveChanges.

using AutoMapper;
using AutoMapper.QueryableExtensions;
using Backend.Domain;
using Backend.DTOs;
using Backend.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

using DomainTaskStatus = Backend.Domain.TaskStatus;

namespace Backend.Queries.Tasks;

public record GetTasksQuery(
    int ProjectId,
    int CurrentUserId,
    DomainTaskStatus? Status = null,
    Priority? Priority = null,
    int? AssigneeId = null
) : IRequest<GetTasksResult>;

public record GetTasksResult(
    bool IsProjectFound,
    bool IsAuthorized,
    List<TaskDto>? Data
);

public class GetTasksHandler : IRequestHandler<GetTasksQuery, GetTasksResult>
{
    private readonly AppDbContext _db;
    private readonly IMapper _mapper;

    public GetTasksHandler(AppDbContext db, IMapper mapper)
    {
        _db = db;
        _mapper = mapper;
    }

    public async Task<GetTasksResult> Handle(GetTasksQuery req, CancellationToken ct)
    {
        var project = await _db.Projects
            .Include(p => p.Members)
            .FirstOrDefaultAsync(p => p.Id == req.ProjectId, ct);

        if (project == null) return new GetTasksResult(false, false, null);

        bool isOwner = project.CreatedById == req.CurrentUserId;
        bool isMember = project.Members.Any(m => m.UserId == req.CurrentUserId);

        if (!isOwner && !isMember) return new GetTasksResult(true, false, null);

        // Apply optional filters using IQueryable
        var query = _db.Tasks
            .AsNoTracking()
            .Where(t => t.ProjectId == req.ProjectId);

        if (req.Status.HasValue)
            query = query.Where(t => t.Status == req.Status.Value);

        if (req.Priority.HasValue)
            query = query.Where(t => t.Priority == req.Priority.Value);

        if (req.AssigneeId.HasValue)
            query = query.Where(t => t.AssigneeId == req.AssigneeId.Value);

        // Project directly to DTO to allow EF Core to optimize the SQL query
        var taskDtos = await query
            .OrderByDescending(t => t.CreatedAt)
            .ProjectTo<TaskDto>(_mapper.ConfigurationProvider)
            .ToListAsync(ct);

        return new GetTasksResult(true, true, taskDtos);
    }
}
