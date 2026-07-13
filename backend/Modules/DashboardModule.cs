// Modules/DashboardModule.cs

using Backend.DTOs;
using Backend.Queries.Dashboard;
using Backend.Services.Auth;
using Carter;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Backend.Modules;

public class DashboardModule : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/dashboard")
            .WithTags("Dashboard")
            .RequireAuthorization();

        group.MapGet("/my-stats", async (
            HttpContext context,
            IMediator mediator,
            CancellationToken ct) =>
        {
            var CurrentUserId = context.User.GetUserId();
            var result = await mediator.Send(new GetMyStatsQuery(CurrentUserId), ct);

            return Results.Ok(result);
        })
        .WithName("GetMyDashboardStats")
        .WithSummary("Get current user task statistics")
        .WithDescription("Returns task count by status, total assigned tasks, and upcoming deadlines (due within 3 days).")
        .Produces<DashboardStatsDto>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized);
    }
}
