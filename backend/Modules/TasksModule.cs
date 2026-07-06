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

            // Points the new task to GET Task Detail endpoint
            return Results.Created($"/api/tasks/{result.Data?.Id}", result.Data);
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

        // ======== 3. GET /api/projects/{projectId}/tasks/{taskId} ========
        // Define a separate group for tasks to avoid the project/{projectId} prefix
        var taskRootGroup = app.MapGroup("/api/tasks")
            .WithTags("Tasks")
            .RequireAuthorization();

        taskRootGroup.MapGet("/{taskId:int}", async (
            int taskId,
            HttpContext context,
            IMediator mediator,
            CancellationToken ct
        ) =>
        {
            var currentUserId = context.User.GetUserId();

            var result = await mediator.Send(
                new GetTaskDetailQuery(taskId, currentUserId), ct);

            if (!result.IsFound)
            {
                return Results.NotFound(new { error = "Task not found" });
            }

            if (!result.IsAuthorized)
            {
                return Results.Json(
                    new { error = "Not authorized to view this task. Project member access required." },
                    statusCode: StatusCodes.Status403Forbidden);
            }

            return Results.Ok(result.Data);
        })
        .WithName("GetTaskDetail")
        .WithSummary("Get task detail")
        .WithDescription("Returns detailed information about a specific task. Requires project member access.")
        .Produces<TaskDto>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status403Forbidden)
        .Produces(StatusCodes.Status404NotFound)
        .Produces(StatusCodes.Status401Unauthorized);

        // ======== 4. PUT /api/tasks/{taskId} ========
        // Updates task fields only. Status excluded — use PATCH /status.
        taskRootGroup.MapPut("/{taskId:int}", async (
            int taskId,
            UpdateTaskRequest req,
            HttpContext context,
            IMediator mediator,
            CancellationToken ct) =>
        {
            var currentUserId = context.User.GetUserId();

            Priority? parsedPriority = null;
            if (req.Priority is not null)
            {
                // Block numeric input with int.TryParse
                if (int.TryParse(req.Priority, out _)
                    || !Enum.TryParse<Priority>(req.Priority, ignoreCase: true, out var p)
                    || !Enum.IsDefined(p))
                {
                    return Results.BadRequest(new { error = "Priority must be 'Low', 'Medium', or 'High'." });
                }
                parsedPriority = p;
            }

            var command = new UpdateTaskCommand(
                taskId,
                currentUserId,
                req.Title,
                req.Description,
                parsedPriority,
                req.DueDate,
                req.AssigneeId,
                req.ClearAssignee
            );

            var result = await mediator.Send(command, ct);

            if (!result.IsFound)
                return Results.NotFound(new { error = "Task not found" });

            if (!result.IsAuthorized)
                return Results.Json(
                    new { error = "Not authorized to update this task. Project member access required." },
                    statusCode: StatusCodes.Status403Forbidden);

            if (!result.IsAssigneeValid)
                return Results.BadRequest(new { error = "Assignee must be a project member" });

            return Results.Ok(result.Data);
        })
        .WithName("UpdateTask")
        .WithSummary("Update a task")
        .WithDescription("Updates task fields (title, description, priority, dueDate, assigneeId). Status is managed via PATCH /status. Requires project member access.")
        .Produces<TaskDto>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status403Forbidden)
        .Produces(StatusCodes.Status404NotFound)
        .Produces(StatusCodes.Status401Unauthorized);

        // ======== 5. PATCH /api/tasks/{taskId}/status ========
        taskRootGroup.MapPatch("/{taskId:int}/status", async (
            int taskId,
            UpdateTaskStatusRequest req,
            HttpContext context,
            IMediator mediator,
            CancellationToken ct) =>
        {
            var currentUserId = context.User.GetUserId();

            if (req.Status == null)
                return Results.BadRequest(new { error = "Status is required." });

            if (int.TryParse(req.Status, out _)
                || !Enum.TryParse<DomainTaskStatus>(req.Status, ignoreCase: true, out var parsedStatus)
                || !Enum.IsDefined(parsedStatus))
            {
                return Results.BadRequest(new { error = "Status must be 'Todo', 'InProgress', or 'Done'." });
            }

            var command = new UpdateTaskStatusCommand(taskId, currentUserId, parsedStatus);

            var result = await mediator.Send(command, ct);

            if (!result.IsFound)
                return Results.NotFound(new { error = "Task not found" });

            if (!result.IsAuthorized)
                return Results.Json(
                    new { error = "Not authorized to update this task's status. Project member access required." },
                    statusCode: StatusCodes.Status403Forbidden);

            return Results.Ok(result.Data);
        })
        .WithName("UpdateTaskStatus")
        .WithSummary("Move task to a new status")
        .WithDescription("Updates the status of a task (Todo/InProgress/Done). Requires project member access.")
        .Produces<TaskDto>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status403Forbidden)
        .Produces(StatusCodes.Status404NotFound)
        .Produces(StatusCodes.Status401Unauthorized);

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
