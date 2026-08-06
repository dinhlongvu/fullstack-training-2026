// Modules/ProjectsModule.cs
// Carter module for Project endpoints.
// Keeps HTTP concerns thin — delegates ALL business logic to MediatR.

using Backend.Commands.Projects;
using Backend.DTOs;
using Backend.Middleware;
using Backend.Queries.Projects;
using Backend.Services.Auth;
using Carter;
using MediatR;

namespace Backend.Modules;

public class ProjectsModule : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/projects")
            .WithTags("Projects")
            .RequireAuthorization(); // All endpoints require JWT Bearer

        // ======== 1. GET /api/projects ========
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
        .Produces<ErrorResponse>(StatusCodes.Status401Unauthorized);

        // ======== 2. POST /api/projects - create project ========
        group.MapPost("/", async (CreateProjectRequest req, HttpContext context, IMediator mediator, CancellationToken ct) =>
        {
            // Extract user ID securely from JWT claim
            var userId = context.User.GetUserId();

            // Combine Request Body + JWT Claim into the CQRS Command
            // Use "??" to coerce null into an empty string right at the Boundary API
            var command = new CreateProjectCommand(req.Name, req.Description ?? string.Empty, userId);

            var result = await mediator.Send(command, ct);
            return Results.Created($"/api/projects/{result.Id}", result); // Return 201 Created with the new project
        })
        .WithName("CreateProject")
        .WithSummary("Create a new project")
        .WithDescription("Create a new project owned by the current user.")
        .Produces<ProjectDto>(StatusCodes.Status201Created) // 201 Created if successful
        .Produces<ValidationErrorResponse>(StatusCodes.Status400BadRequest) // Auto-returns 400 if FluentValidation fails
        .Produces<ErrorResponse>(StatusCodes.Status401Unauthorized); // 401 Unauthorized if token invalid

        // ======== 3. GET /api/projects/{id} ========
        // Returns detailed project info if the current user is the owner or a member
        group.MapGet("/{id:int}", async (int id, HttpContext context, IMediator mediator, CancellationToken ct) =>
        {
            var userId = context.User.GetUserId();
            var result = await mediator.Send(new GetProjectDetailQuery(id, userId), ct);

            // Handle 404 — project does not exist or caller is not a member / owner
            if (!result.IsFound || !result.IsAuthorized)
            {
                return ErrorResults.NotFound(context, "Project not found");
            }

            // Handle 200 OK
            return Results.Ok(result.Data);
        })
        .WithName("GetProjectDetail")
        .WithSummary("Get project details")
        .WithDescription("Returns detailed information about a specific project if the current user is the owner or a member.")
        .Produces<ProjectDetailDto>(StatusCodes.Status200OK)
        .Produces<ErrorResponse>(StatusCodes.Status404NotFound)
        .Produces<ErrorResponse>(StatusCodes.Status401Unauthorized);

        // ======== 4. PUT /api/projects/{id} ========
        // Updates project details
        group.MapPut("/{id:int}", async (int id, UpdateProjectRequest req, HttpContext context, IMediator mediator, CancellationToken ct) =>
        {
            var userId = context.User.GetUserId();

            // Coerce null description into an empty string at the API boundary
            var command = new UpdateProjectCommand(id, req.Name, req.Description ?? string.Empty, userId);

            var result = await mediator.Send(command, ct);

            // Handle 404 — project does not exist or caller is not a member / owner
            if (!result.IsFound || !result.IsAuthorized)
            {
                return ErrorResults.NotFound(context, "Project not found");
            }

            // Handle 200 OK
            return Results.Ok(result.Data);
        })
        .WithName("UpdateProject")
        .WithSummary("Update project details")
        .WithDescription("Updates the name and description of a project. Can only be performed by the project creator.")
        .Produces<ProjectDto>(StatusCodes.Status200OK)
        .Produces<ValidationErrorResponse>(StatusCodes.Status400BadRequest)
        .Produces<ErrorResponse>(StatusCodes.Status404NotFound)
        .Produces<ErrorResponse>(StatusCodes.Status401Unauthorized);

        // ======== 5. DELETE /api/projects/{id} ========
        group.MapDelete("/{id:int}", async (int id, HttpContext context, IMediator mediator, CancellationToken ct) =>
        {
            var userId = context.User.GetUserId();

            var command = new DeleteProjectCommand(id, userId);
            var result = await mediator.Send(command, ct);

            if (!result.IsFound || !result.IsAuthorized)
            {
                return ErrorResults.NotFound(context, "Project not found");
            }

            return Results.NoContent();
        })
        .WithName("DeleteProject")
        .WithSummary("Delete a project")
        .WithDescription("Deletes a project. Only the project owner can delete it. Cascade deletes all related ProjectMembers, Tasks, and Comments.")
        .Produces(StatusCodes.Status204NoContent)
        .Produces<ErrorResponse>(StatusCodes.Status404NotFound)
        .Produces<ErrorResponse>(StatusCodes.Status401Unauthorized);

        // ======== 6. POST /api/projects/{id}/members ========
        group.MapPost("/{id:int}/members", async (int id, AddProjectMemberDto req, HttpContext context, IMediator mediator, CancellationToken ct) =>
        {
            // Extract the current user ID from JWT
            var currentUserId = context.User.GetUserId();

            // Dispatch the command
            var command = new AddProjectMemberCommand(id, req.Email, currentUserId);
            var result = await mediator.Send(command, ct);

            // Handle 404 — project or target user does not exist, or caller is not the owner.
            if (!result.IsProjectFound || !result.IsUserFound || !result.IsAuthorized)
                return ErrorResults.NotFound(context, "Project or User not found");

            // Handle 409 — the target user is already a member of this project.
            if (result.IsAlreadyMember)
            {
                return ErrorResults.Conflict(context, "User is already a member of this project");
            }

            // Handle 201 Created
            return Results.Created($"/api/projects/{id}/members/{result.Data?.UserId}", result.Data);
        })
        .WithName("AddProjectMember")
        .WithSummary("Add user to project")
        .WithDescription("Add user to project. Owner-only. Validates user exists, validates user not already a member.")
        .Produces<ProjectMemberDto>(StatusCodes.Status201Created)
        .Produces<ValidationErrorResponse>(StatusCodes.Status400BadRequest)
        .Produces<ErrorResponse>(StatusCodes.Status404NotFound)
        .Produces<ErrorResponse>(StatusCodes.Status401Unauthorized)
        .Produces<ErrorResponse>(StatusCodes.Status409Conflict);
    }
}
