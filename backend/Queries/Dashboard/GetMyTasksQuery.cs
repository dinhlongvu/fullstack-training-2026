// Queries/Dashboard/GetMyTasksQuery.cs

using Backend.DTOs;
using Backend.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;
using DomainPriority = Backend.Domain.Priority;
using DomainTaskStatus = Backend.Domain.TaskStatus;

namespace Backend.Queries.Dashboard;

public record GetMyTasksQuery(
    int CurrentUserId,
    int Page = 1,
    int PageSize = 20,
    bool IsUrgentOnly = false
) : IRequest<PaginatedList<MyTaskDto>>;

public class GetMyTasksHandler : IRequestHandler<GetMyTasksQuery, PaginatedList<MyTaskDto>>
{
    private readonly AppDbContext _db;

    public GetMyTasksHandler(AppDbContext db)
    {
        _db = db;
    }

    public async Task<PaginatedList<MyTaskDto>> Handle(GetMyTasksQuery req, CancellationToken ct)
    {
        var query = _db.Tasks
            .AsNoTracking()
            .Where(t => t.AssigneeId == req.CurrentUserId);

        // Add filter isUrgentOnly
        if (req.IsUrgentOnly)
        {
            var inThreeDays = DateTime.UtcNow.AddDays(3);
            query = query.Where(t => t.Status != DomainTaskStatus.Done
                                  && t.DueDate.HasValue
                                  && t.DueDate.Value <= inThreeDays);
        }

        // Count the total number of records before paging
        var totalCount = await query.CountAsync(ct);

        // Sort, paginate, map to DTO
        var items = await query
            .OrderBy(t => t.DueDate)
            .ThenByDescending(t => t.Priority == DomainPriority.High ? 2
                                 : t.Priority == DomainPriority.Medium ? 1 : 0)
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .Select(t => new MyTaskDto(
                t.Id,
                t.Title,
                t.Description,
                (int)t.Status,
                (int)t.Priority,
                t.DueDate,
                t.ProjectId,
                t.AssigneeId
            ))
            .ToListAsync(ct);
        return new PaginatedList<MyTaskDto>(items, totalCount, req.Page, req.PageSize);
    }
}
