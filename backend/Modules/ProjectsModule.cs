// Modules/ProjectsModule.cs
// Carter module for Project endpoints.
// Keeps HTTP concerns thin — delegates ALL business logic to MediatR.

using Backend.DTOs;
using Backend.Queries.Projects;
using Backend.Services.Auth;
using Carter;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Backend.Modules;

public class ProjectsModule : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/projects")
            .RequireAuthorization(); // All endpoints require JWT Bearer

        // GET /api/projects
        // Returns all projects where current user is owner OR member, sorted by CreatedAt desc.
        group.MapGet("/", async (HttpContext context, IMediator mediator, CancellationToken ct) =>
        {
            // Extract user ID from "sub" claim — throws 401 if token is invalid
            var userId = context.User.GetUserId();

            var result = await mediator.Send(new GetProjectsQuery(userId), ct);
            return Results.Ok(result);
        })
        .WithName("GetProjects")
        .WithSummary("List user's projects")
        .WithDescription("Returns all projects where the current user is owner OR member, sorted by CreatedAt descending.")
        .Produces<List<ProjectListDto>>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized);
    }
}
