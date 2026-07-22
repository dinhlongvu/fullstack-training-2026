// Queries/Dashboard/GetMyStatsQuery.cs

using Backend.DTOs;
using Backend.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

using DomainTaskStatus = Backend.Domain.TaskStatus;

namespace Backend.Queries.Dashboard;

public record GetMyStatsQuery(int CurrentUserId) : IRequest<DashboardStatsDto>;

public class GetMyStatsHandler : IRequestHandler<GetMyStatsQuery, DashboardStatsDto>
{
    private readonly AppDbContext _db;

    public GetMyStatsHandler(AppDbContext db)
    {
        _db = db;
    }

    public async Task<DashboardStatsDto> Handle(GetMyStatsQuery req, CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var inThreeDays = now.AddDays(3);

        var statusCounts = await _db.Tasks
            .Where(t => t.AssigneeId == req.CurrentUserId)
            .GroupBy(t => t.Status)
            .Select(g => new
            {
                Status = g.Key,
                Count = g.Count()
            })
            .ToDictionaryAsync(k => k.Status, v => v.Count, ct);

        int todoCount = statusCounts.GetValueOrDefault(DomainTaskStatus.Todo, 0);
        int inProgressCount = statusCounts.GetValueOrDefault(DomainTaskStatus.InProgress, 0);
        int doneCount = statusCounts.GetValueOrDefault(DomainTaskStatus.Done, 0);

        int totalAssigned = todoCount + inProgressCount + doneCount;

        // Overdue = open tasks whose (end-of-day) due date has already passed.
        // Counted separately and WITHOUT a cap, so a large overdue backlog can
        // never push upcoming tasks out of the capped list below.
        var overdueCount = await _db.Tasks
            .Where(t => t.AssigneeId == req.CurrentUserId
                    && t.Status != DomainTaskStatus.Done
                    && t.DueDate.HasValue
                    && t.DueDate.Value < now)
            .CountAsync(ct);

        // Upcoming = open tasks due from now up to 3 days out. Overdue is excluded
        // here, so Take(20) only ever trims far-future items, not today's work.
        var upcomming = await _db.Tasks
            .Where(t => t.AssigneeId == req.CurrentUserId
                    && t.Status != DomainTaskStatus.Done
                    && t.DueDate.HasValue
                    && t.DueDate.Value >= now
                    && t.DueDate.Value <= inThreeDays)
            .OrderBy(t => t.DueDate)
            .ThenByDescending(t => t.Priority == Domain.Priority.High ? 2
                                : t.Priority == Domain.Priority.Medium ? 1 : 0)
            .Take(20)
            .Select(t => new UpcomingDeadlineDto(
                t.Id,
                t.Title,
                t.DueDate!.Value,
                t.ProjectId,
                t.Priority
            ))
            .ToListAsync(ct);

        return new DashboardStatsDto(
            new TaskStatsByStatusDto(todoCount, inProgressCount, doneCount),
            upcomming,
            totalAssigned,
            overdueCount
        );
    }
}
