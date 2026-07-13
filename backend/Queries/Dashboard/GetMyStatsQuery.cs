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

        // Get the Upcoming Deadlines list
        var upcomming = await _db.Tasks
            .Where(t => t.AssigneeId == req.CurrentUserId
                    && t.Status != DomainTaskStatus.Done
                    && t.DueDate.HasValue
                    && t.DueDate.Value >= now
                    && t.DueDate.Value <= inThreeDays)
            .OrderBy(t => t.DueDate)
            .Select(t => new UpcomingDeadlineDto(
                t.Id,
                t.Title,
                t.DueDate!.Value,
                t.ProjectId
            ))
            .ToListAsync(ct);

        return new DashboardStatsDto(
            new TaskStatsByStatusDto(todoCount, inProgressCount, doneCount),
            upcomming,
            totalAssigned
        );
    }
}
