// Modules/TasksModule.cs
// Carter module = 1 file per resource group.
// Contains all HTTP endpoints for Tasks: GET, POST, PATCH, DELETE.
// Module stays thin — delegates ALL business logic to MediatR handlers.

using Backend.Commands.Tasks;
using Backend.Domain;
using Backend.DTOs;
using Backend.Middleware;
using Backend.Queries.Tasks;
using Backend.Services.Auth;
using Carter;
using MediatR;
using Microsoft.AspNetCore.Mvc;

// Alias to avoid collision with System.Threading.Tasks.Task
using DomainTaskStatus = Backend.Domain.TaskStatus;

namespace Backend.Modules;

public class TasksModule : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/projects/{projectId:int}/tasks")
            .WithTags("Tasks")
            .RequireAuthorization();

        // ======== 1. GET /api/projects/{projectId}/tasks ========
        // Returns all tasks in a project, with optional filters
        group.MapGet("/", async (
            int projectId,
            [FromQuery] string? status,   // ?status=Todo|InProgress|Done
            [FromQuery] string? priority,         // ?priority=Low|Medium|High
            [FromQuery] int? assigneeId,            // ?assigneeId=id
            HttpContext context,
            IMediator mediator,
            CancellationToken ct) =>
        {
            var currentUserId = context.User.GetUserId();

            DomainTaskStatus? parsedStatus = null;
            if (!string.IsNullOrWhiteSpace(status))
            {
                if (!TryParseStatus(status, out var s))
                {
                    return Results.BadRequest(new ValidationErrorResponse
                    {
                        Errors = new[] { "Status must be 'Todo', 'InProgress', or 'Done'." },
                        TraceId = context.GetTraceId()
                    });
                }
                parsedStatus = s;
            }

            Priority? parsedPriority = null;
            if (!string.IsNullOrWhiteSpace(priority))
            {
                // Block garbage or numeric values
                if (!TryParsePriority(priority, out var p))
                {
                    return Results.BadRequest(new ValidationErrorResponse
                    {
                        Errors = new[] { "Priority must be 'Low', 'Medium', or 'High'." },
                        TraceId = context.GetTraceId()
                    });
                }
                parsedPriority = p;
            }

            var result = await mediator.Send(
                new GetTasksQuery(projectId, currentUserId, parsedStatus, parsedPriority, assigneeId), ct);

            if (!result.IsProjectFound || !result.IsAuthorized)
            {
                return Results.NotFound(new { error = "Project not found" });
            }

            return Results.Ok(result.Data);
        })
        .WithName("GetProjectTasks")
        .WithSummary("Get tasks in a project")
        .WithDescription("Get the list of project tasks. Optional filter: status (Todo | InProgress | Done), priority (Low | Medium | High), assigneeId.")
        .Produces<List<TaskDto>>(StatusCodes.Status200OK)
        .Produces<ValidationErrorResponse>(StatusCodes.Status400BadRequest)
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

            Priority parsedPriority = Priority.Medium;
            if (req.Priority != null)
            {
                if (!TryParsePriority(req.Priority, out var p))
                {
                    return Results.BadRequest(new ValidationErrorResponse
                    {
                        Errors = new[] { "Priority must be 'Low', 'Medium', or 'High'." },
                        TraceId = context.GetTraceId()
                    });
                }
                parsedPriority = p;
            }

            var command = new CreateTaskCommand(
                projectId,
                req.Title,
                req.Description,
                parsedPriority,
                req.DueDate,
                currentUserId,
                req.AssigneeId
            );

            var result = await mediator.Send(command);

            if (!result.IsProjectFound || !result.IsAuthorized)
                return Results.NotFound(new { error = "Project not found" });

            if (!result.IsAssigneeValid)
                return Results.BadRequest(new ValidationErrorResponse
                {
                    Errors = new[] { "Assignee must be a project member" },
                    TraceId = context.GetTraceId()
                });

            // Points the new task to GET Task Detail endpoint
            return Results.Created($"/api/tasks/{result.Data?.Id}", result.Data);
        })
        .WithName("CreateTask")
        .WithSummary("Create a new task")
        .WithDescription("Creates a new task in the specified project. Requires project member access.")
        .Produces<TaskDto>(StatusCodes.Status201Created)
        .Produces<ValidationErrorResponse>(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status404NotFound)
        .Produces(StatusCodes.Status401Unauthorized);

        // ======== 3. GET /api/tasks/{taskId} ========
        // Define a separate group for tasks to avoid the project/{projectId} prefix
        var taskRootGroup = app.MapGroup("/api/tasks")
            .WithTags("Tasks")
            .RequireAuthorization();

        taskRootGroup.MapGet("/{taskId:int}", async (
            int taskId,
            HttpContext context,
            IMediator mediator,
            CancellationToken ct) =>
        {
            var currentUserId = context.User.GetUserId();

            var result = await mediator.Send(
                new GetTaskDetailQuery(taskId, currentUserId), ct);

            if (!result.IsFound || !result.IsAuthorized)
            {
                return Results.NotFound(new { error = "Task not found" });
            }

            return Results.Ok(result.Data);
        })
        .WithName("GetTaskDetail")
        .WithSummary("Get task detail")
        .WithDescription("Returns detailed information about a specific task. Requires project member access.")
        .Produces<TaskDto>(StatusCodes.Status200OK)
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
                if (!TryParsePriority(req.Priority, out var p))
                {
                    return Results.BadRequest(new ValidationErrorResponse
                    {
                        Errors = new[] { "Priority must be 'Low', 'Medium', or 'High'." },
                        TraceId = context.GetTraceId()
                    });
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
                req.ClearAssignee,
                req.ClearDueDate
            );

            var result = await mediator.Send(command, ct);

            if (!result.IsFound || !result.IsAuthorized)
                return Results.NotFound(new { error = "Task not found" });

            if (!result.IsAssigneeValid)
                return Results.BadRequest(new ValidationErrorResponse
                {
                    Errors = new[] { "Assignee must be a project member" },
                    TraceId = context.GetTraceId()
                });

            return Results.Ok(result.Data);
        })
        .WithName("UpdateTask")
        .WithSummary("Update a task")
        .WithDescription("Updates task fields (title, description, priority, dueDate, assigneeId). Status is managed via PATCH /status. Requires project member access.")
        .Produces<TaskDto>(StatusCodes.Status200OK)
        .Produces<ValidationErrorResponse>(StatusCodes.Status400BadRequest)
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

            if (string.IsNullOrWhiteSpace(req.Status))
            {
                return Results.BadRequest(new ValidationErrorResponse
                {
                    Errors = new[] { "Status is required." },
                    TraceId = context.GetTraceId()
                });
            }

            if (!TryParseStatus(req.Status, out var parsedStatus))
            {
                return Results.BadRequest(new ValidationErrorResponse
                {
                    Errors = new[] { "Status must be 'Todo', 'InProgress', or 'Done'." },
                    TraceId = context.GetTraceId()
                });
            }

            var command = new UpdateTaskStatusCommand(taskId, currentUserId, parsedStatus);

            var result = await mediator.Send(command, ct);

            if (!result.IsFound || !result.IsAuthorized)
                return Results.NotFound(new { error = "Task not found" });

            return Results.Ok(result.Data);
        })
        .WithName("UpdateTaskStatus")
        .WithSummary("Move task to a new status")
        .WithDescription("Updates the status of a task (Todo/InProgress/Done). Requires project member access.")
        .Produces<TaskDto>(StatusCodes.Status200OK)
        .Produces<ValidationErrorResponse>(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status404NotFound)
        .Produces(StatusCodes.Status401Unauthorized);

        // ======== 6. PATCH /api/tasks/{taskId}/assign ========
        // Assign OR unassign task to a project member
        taskRootGroup.MapPatch("/{taskId:int}/assign", async (
            int taskId,
            AssignTaskRequest req,
            HttpContext context,
            IMediator mediator,
            CancellationToken ct) =>
        {
            var currentUserId = context.User.GetUserId();

            var command = new AssignTaskCommand(
                taskId,
                currentUserId,
                req.AssigneeId
            );

            var result = await mediator.Send(command, ct);

            if (!result.IsFound || !result.IsAuthorized)
                return Results.NotFound(new { error = "Task not found" });

            if (!result.IsAssigneeValid)
                return Results.BadRequest(new ValidationErrorResponse
                {
                    Errors = new[] { "Assignee must be a project member or project owner" },
                    TraceId = context.GetTraceId()
                });

            return Results.Ok(result.Data);
        })
        .WithName("AssignTask")
        .WithSummary("Assign or unassign a task")
        .WithDescription("Assigns a task to a project member. Pass null to unassign. Requires project member access.")
        .Produces<TaskDto>(StatusCodes.Status200OK)
        .Produces<ValidationErrorResponse>(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status404NotFound)
        .Produces(StatusCodes.Status401Unauthorized);

        // ======== 7. DELETE /api/tasks/{taskId} ========
        taskRootGroup.MapDelete("/{taskId:int}", async (
            int taskId,
            HttpContext context,
            IMediator mediator,
            CancellationToken ct) =>
        {
            var currentUserId = context.User.GetUserId();

            var result = await mediator.Send(new DeleteTaskCommand(taskId, currentUserId), ct);

            if (!result.IsFound || !result.IsAuthorized)
                return Results.NotFound(new { error = "Task not found" });

            return Results.NoContent();
        })
        .WithName("DeleteTask")
        .WithSummary("Delete a task")
        .WithDescription("Deletes a task and utilizes DB cascade for comments. Requires project member access.")
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status404NotFound)
        .Produces(StatusCodes.Status401Unauthorized);

        // ======== 8. GET /api/tasks/{taskId}/comments ========
        taskRootGroup.MapGet("/{taskId:int}/comments", async (
            int taskId,
            HttpContext context,
            IMediator mediator,
            CancellationToken ct) =>
        {
            var currentUserId = context.User.GetUserId();
            var result = await mediator.Send(new GetTaskCommentsQuery(taskId, currentUserId), ct);

            if (!result.IsTaskFound || !result.IsAuthorized)
                return Results.NotFound(new { error = "Task not found" });

            return Results.Ok(result.Data);
        })
        .WithName("GetTaskComments")
        .WithSummary("Get all comments for a task")
        .WithDescription("Returns a chronological list of comments for a task, embedded with author names.")
        .Produces<List<CommentDto>>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status404NotFound)
        .Produces(StatusCodes.Status401Unauthorized);

        // ======== 9. POST /api/tasks/{taskId}/comments ========
        taskRootGroup.MapPost("/{taskId:int}/comments", async (
            int taskId,
            CreateCommentRequest req,
            HttpContext context,
            IMediator mediator,
            CancellationToken ct) =>
        {
            var currentUserId = context.User.GetUserId();

            var command = new CreateCommentCommand(taskId, currentUserId, req.Content);
            var result = await mediator.Send(command, ct);

            if (!result.IsTaskFound || !result.IsAuthorized)
                return Results.NotFound(new { error = "Task not found" });

            return Results.Json(result.Data, statusCode: StatusCodes.Status201Created);
        })
        .WithName("CreateComment")
        .WithSummary("Add a comment to a task")
        .WithDescription("Creates a new comment. Validates content length and ensures project member authorization.")
        .Produces<CommentDto>(StatusCodes.Status201Created)
        .Produces<ValidationErrorResponse>(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status404NotFound)
        .Produces(StatusCodes.Status401Unauthorized);

        // ======== 10. DELETE /api/tasks/{taskId}/comments/{commentId} ========
        taskRootGroup.MapDelete("/{taskId:int}/comments/{commentId:int}", async (
            int taskId,
            int commentId,
            HttpContext context,
            IMediator mediator,
            CancellationToken ct) =>
        {
            var currentUserId = context.User.GetUserId();
            var command = new DeleteCommentCommand(taskId, commentId, currentUserId);

            var result = await mediator.Send(command, ct);

            if (!result.IsFound || !result.IsAuthorized)
                return Results.NotFound(new { error = "Comment not found" });

            return Results.NoContent();
        })
        .WithName("DeleteComment")
        .WithSummary("Delete a comment within a task")
        .WithDescription("Allows users to delete their own comments, and Project Managers to delete any comment within their projects.")
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status404NotFound)
        .Produces(StatusCodes.Status401Unauthorized);
    }
    private static bool TryParsePriority(string? input, out Priority priority)
    {
        priority = default;

        // Block empty strings and multi-value lists ("Low,High")
        if (string.IsNullOrWhiteSpace(input) || input.Contains(','))
            return false;

        return !int.TryParse(input, out _)
            && Enum.TryParse<Priority>(input, ignoreCase: true, out priority)
            && Enum.IsDefined(priority);
    }

    private static bool TryParseStatus(string? input, out DomainTaskStatus status)
    {
        status = default;

        // Block empty strings and multi-value lists ("Todo,Done")
        if (string.IsNullOrWhiteSpace(input) || input.Contains(','))
            return false;

        return !int.TryParse(input, out _)
            && Enum.TryParse<DomainTaskStatus>(input, ignoreCase: true, out status)
            && Enum.IsDefined(status);
    }
}
