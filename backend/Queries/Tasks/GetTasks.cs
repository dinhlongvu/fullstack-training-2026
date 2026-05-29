// Queries/Tasks/GetTasks.cs
// CQRS Query: ONE file = Query record + Handler.
// Queries only READ data — no side effects, no SaveChanges.

using Backend.DTOs;
using Backend.Infrastructure.Data;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Backend.Queries.Tasks;

// 1. Query = the "request" DTO
public record GetTasksQuery(
    int ProjectId,
    string? Status = null,
    string? Priority = null,
    int? AssigneeId = null
) : IRequest<List<TaskSummaryDto>>;

// 2. Handler = read-only logic
public class GetTasksHandler : IRequestHandler<GetTasksQuery, List<TaskSummaryDto>>
{
    private readonly AppDbContext _db;
    private readonly IMapper _mapper;

    public GetTasksHandler(AppDbContext db, IMapper mapper)
    {
        _db = db;
        _mapper = mapper;
    }

    public async Task<List<TaskSummaryDto>> Handle(GetTasksQuery q, CancellationToken ct)
    {
        var query = _db.Tasks
            .Where(t => t.ProjectId == q.ProjectId);

        // Apply optional filters
        if (!string.IsNullOrWhiteSpace(q.Status))
            query = query.Where(t => t.Status.ToString() == q.Status);

        if (!string.IsNullOrWhiteSpace(q.Priority))
            query = query.Where(t => t.Priority.ToString() == q.Priority);

        if (q.AssigneeId.HasValue)
            query = query.Where(t => t.AssigneeId == q.AssigneeId);

        // ProjectTo<T> = SQL SELECT of only needed columns (fast!)
        return await query
            .OrderByDescending(t => t.CreatedAt)
            .ProjectTo<TaskSummaryDto>(_mapper.ConfigurationProvider)
            .ToListAsync(ct);
    }
}
