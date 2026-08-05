// Modules/DashboardModule.cs

using Backend.DTOs;
using Backend.Queries.Dashboard;
using Backend.Services.Auth;
using Carter;
using MediatR;

namespace Backend.Modules;

public class DashboardModule : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/dashboard")
            .WithTags("Dashboard")
            .RequireAuthorization();

        // ======== 1. GET /api/dashboard/my-stats ========
        group.MapGet("/my-stats", async (
            HttpContext context,
            IMediator mediator,
            CancellationToken ct) =>
        {
            var currentUserId = context.User.GetUserId();
            var result = await mediator.Send(new GetMyStatsQuery(currentUserId), ct);

            return Results.Ok(result);
        })
        .WithName("GetMyDashboardStats")
        .WithSummary("Get current user task statistics")
        .WithDescription("Returns task count by status, total assigned tasks, and upcoming deadlines (due within 3 days).")
        .Produces<DashboardStatsDto>(StatusCodes.Status200OK)
        .Produces<ErrorResponse>(StatusCodes.Status401Unauthorized);

        // ======== 2. GET /api/dashboard/my-tasks ========  
        group.MapGet("/my-tasks", async (
            HttpContext context,
            IMediator mediator,
            int page = 1,
            int pageSize = 20,
            bool isUrgentOnly = false,
            CancellationToken ct = default) =>
        {
            var currentUserId = context.User.GetUserId();
            var query = new GetMyTasksQuery(currentUserId, page, pageSize, isUrgentOnly);

            var result = await mediator.Send(query, ct);

            return Results.Ok(result);
        })
        .WithName("GetMyTasks")
        .WithSummary("Get a paginated list of tasks assigned to the current user")
        .WithDescription("Returns all tasks assigned to the authenticated user, across all projects. Supports filtering by urgency.")
        .Produces<PaginatedList<MyTaskDto>>(StatusCodes.Status200OK)
        .Produces<ErrorResponse>(StatusCodes.Status401Unauthorized);
    }
}
