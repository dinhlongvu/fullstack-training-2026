// Modules/TasksModule.cs
// Carter module = 1 file per resource group.
// Contains all HTTP endpoints for Tasks: GET, POST, PATCH, DELETE.
// Module stays thin — delegates ALL business logic to MediatR handlers.

using Backend.Commands.Tasks;
using Backend.Domain;
using Backend.DTOs;
using Backend.Queries.Tasks;
using Backend.Services.Auth;
using Carter;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

// Alias to avoid collision with System.Threading.Tasks.Task
using DomainTaskStatus = Backend.Domain.TaskStatus;

namespace Backend.Modules;

public class TasksModule : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/projects/{projectId:int}/tasks")
            .RequireAuthorization();

        // ======== 1. GET /api/projects/{projectId}/tasks ========
        // Returns all tasks in a project, with optional filters
        group.MapGet("/", async (
            int projectId,
            [FromQuery] DomainTaskStatus? status,   // ?status=Todo|InProgress|Done
            [FromQuery] Priority? priority,         // ?priority=Low|Medium|High
            [FromQuery] int? assigneeId,            // ?assigneeId=id
            HttpContext context,
            IMediator mediator,
            CancellationToken ct) =>
        {
            var currentUserId = context.User.GetUserId();

            var result = await mediator.Send(
                new GetTasksQuery(projectId, currentUserId, status, priority, assigneeId), ct);

            if (!result.IsProjectFound)
            {
                return Results.NotFound(new { error = "Project not found" });
            }

            if (!result.IsAuthorized)
            {
                return Results.Json(
                    new { error = "Not authorized to view tasks in this project. Project member access required." },
                    statusCode: StatusCodes.Status403Forbidden);
            }

            return Results.Ok(result.Data);
        })
        .WithName("GetProjectTasks")
        .WithSummary("Get tasks in a project")
        .WithDescription("Returns a list of tasks for a project. Supports filtering by status, priority, and assigneeId. Must be project owner or member.")
        .Produces<List<TaskDto>>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status403Forbidden)
        .Produces(StatusCodes.Status404NotFound)
        .Produces(StatusCodes.Status401Unauthorized);

        // ======== 2. POST /api/projects/{projectId}/tasks ========
        group.MapPost("/", async (
            int projectId,
            CreateTaskRequest req,
            HttpContext context,
            IMediator mediator) =>
        {
            var currentUserId = context.User.GetUserId();

            var command = new CreateTaskCommand(
                projectId,
                req.Title,
                req.Description,
                req.Priority,
                req.DueDate,
                currentUserId,
                req.AssigneeId
            );

            var result = await mediator.Send(command);

            if (!result.IsProjectFound)
            {
                return Results.NotFound(new { error = "Project not found" });
            }

            if (!result.IsAuthorized)
            {
                return Results.Json(
                    new { error = "Not authorized to create tasks in this project. Project member access required." },
                    statusCode: StatusCodes.Status403Forbidden);
            }

            if (!result.IsAssigneeValid)
            {
                return Results.BadRequest(new { error = "Assignee must be a project member" });
            }

            return Results.Created($"/api/projects/{projectId}/tasks", result.Data);
        })
        .WithName("CreateTask")
        .WithSummary("Create a new task")
        .WithDescription("Creates a new task in the specified project. Requires project member access.")
        .Produces<TaskDto>(StatusCodes.Status201Created)
        .ProducesValidationProblem()
        .Produces(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status403Forbidden)
        .Produces(StatusCodes.Status404NotFound)
        .Produces(StatusCodes.Status401Unauthorized);

        // ======== PATCH /api/tasks/{taskId}/status ========
        app.MapPatch("/api/tasks/{taskId:int}/status", async (
            int taskId,
            UpdateTaskStatusCommand command,
            IMediator mediator) =>
        {
            command = command with { TaskId = taskId };
            await mediator.Send(command);
            return Results.NoContent();
        });

        // ======== DELETE /api/tasks/{taskId} ========
        app.MapDelete("/api/tasks/{taskId:int}", async (
            int taskId,
            IMediator mediator) =>
        {
            await mediator.Send(new DeleteTaskCommand(taskId));
            return Results.NoContent();
        });
    }
}
