// Modules/TasksModule.cs
// Carter module = 1 file per resource group.
// Contains all HTTP endpoints for Tasks: GET, POST, PUT, PATCH, DELETE.
// Module stays thin — delegates ALL business logic to MediatR handlers.

using Backend.Commands.Tasks;
using Backend.Queries.Tasks;
using Carter;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Modules;

public class TasksModule : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/projects/{projectId:int}/tasks")
            .RequireAuthorization(); // All endpoints require JWT

        // GET /api/projects/1/tasks?status=Todo&priority=High
        group.MapGet("/", async (
            int projectId,
            [FromQuery] string? status,
            [FromQuery] string? priority,
            [FromQuery] int? assigneeId,
            IMediator mediator) =>
        {
            var tasks = await mediator.Send(new GetTasksQuery(projectId, status, priority, assigneeId));
            return Results.Ok(tasks);
        });

        // POST /api/projects/1/tasks
        group.MapPost("/", async (
            int projectId,
            CreateTaskCommand command,
            IMediator mediator) =>
        {
            command = command with { ProjectId = projectId };
            var task = await mediator.Send(command);
            return Results.Created($"/api/tasks/{task.Id}", task);
        });

        // PATCH /api/tasks/5/status
        app.MapPatch("/api/tasks/{taskId:int}/status", async (
            int taskId,
            UpdateTaskStatusCommand command,
            IMediator mediator) =>
        {
            command = command with { TaskId = taskId };
            await mediator.Send(command);
            return Results.NoContent();
        });

        // DELETE /api/tasks/5
        app.MapDelete("/api/tasks/{taskId:int}", async (
            int taskId,
            IMediator mediator) =>
        {
            await mediator.Send(new DeleteTaskCommand(taskId));
            return Results.NoContent();
        });
    }
}
