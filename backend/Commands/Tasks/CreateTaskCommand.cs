// Commands/Tasks/CreateTaskCommand.cs

using Backend.Domain;
using Backend.DTOs;
using MediatR;

namespace Backend.Commands.Tasks;

// Internal CQRS command — constructed in code, not bound from HTTP body
public record CreateTaskCommand(
    int ProjectId,
    string Title,
    string Description,
    Priority Priority,
    DateTime? DueDate,
    int CurrentUserId,
    int? AssigneeId
) : IRequest<CreateTaskResult>;

public record CreateTaskResult(
    bool IsProjectFound,
    bool IsAuthorized,
    bool IsAssigneeValid,
    TaskDto? Data
);

/// <summary>
/// Request payload to create a new task within a project.
/// </summary>
public record CreateTaskRequest
{
    /// <summary>The title of the task.</summary>
    /// <example>Implement Login Page</example>
    public string Title { get; init; } = string.Empty;

    /// <summary>Detailed description of what needs to be done.</summary>
    /// <example>Create the login UI and integrate with the authentication API.</example>
    public string Description { get; init; } = string.Empty;

    /// <summary>Task priority level. Accepted values: Low, Medium, High.</summary>
    /// <example>High</example>
    public Priority Priority { get; init; }

    /// <summary>Optional due date for the task.</summary>
    /// <example>2026-07-31</example>
    public DateTime? DueDate { get; init; }

    /// <summary>Optional ID of a project member to assign this task to.</summary>
    /// <example>1</example>
    public int? AssigneeId { get; init; }
}
