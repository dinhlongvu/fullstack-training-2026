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
using Backend.Commands.Projects;

namespace Backend.Modules;

public class ProjectsModule : ICarterModule
{
    public record CreateProjectRequest(string Name, string Description);
    
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
            return Results.Ok(result); // Return 200 OK with the list of projects
        })
        .WithName("GetProjects")
        .WithSummary("List user's projects")
        .WithDescription("Returns all projects where the current user is owner OR member, sorted by CreatedAt descending.")
        .Produces<List<ProjectListDto>>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized);

        // POST /api/projects - create project
        group.MapPost("/", async (CreateProjectRequest req, HttpContext context, IMediator mediator, CancellationToken ct) =>
        {
            // Extract user ID securely from JWT claim
            var userId = context.User.GetUserId();
            
            // Combine Request Body + JWT Claim into the CQRS Command
            var command = new CreateProjectCommand(req.Name, req.Description, userId);
            
            var result = await mediator.Send(command, ct);
            return Results.Created($"/api/projects/{result.Id}", result); // Return 201 Created with the new project
        })        
        .WithName("CreateProject")
        .WithSummary("Create a new project")
        .WithDescription("Create a new project owned by the current user.")
        .Produces<ProjectDto>(StatusCodes.Status201Created) // 201 Created if successful
        .ProducesValidationProblem() // Auto-returns 400 if FluentValidation fails
        .Produces(StatusCodes.Status401Unauthorized); // 401 Unauthorized if token invalid
    }
}
