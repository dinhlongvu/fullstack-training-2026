// Commands/Tasks/UpdateTaskCommand.cs

using Backend.Domain;
using Backend.DTOs;
using MediatR;

namespace Backend.Commands.Tasks;

public record UpdateTaskCommand(
    int TaskId,
    int CurrentUserId,
    // Nullable = optional; null means "caller did not send this field"
    string? Title,
    string? Description,
    Priority? Priority,
    DateTime? DueDate,
    int? AssigneeId,
    bool ClearAssignee,  // true when caller explicitly wants to remove assignee
    bool ClearDueDate   // true when caller explicitly wants to remove due date
) : IRequest<UpdateTaskResult>;

public record UpdateTaskResult(
    bool IsFound,
    bool IsAuthorized,
    bool IsAssigneeValid,
    TaskDto? Data
);

/// <summary>
/// Request payload to update an existing task. All fields are optional — only sent fields are updated.
/// </summary>
public record UpdateTaskRequest
{
    /// <summary>The new title of the task.</summary>
    /// <example>Updated Login Page Design</example>
    public string? Title { get; init; }

    /// <summary>The new description of the task.</summary>
    /// <example>Redesign the login page with the new branding guidelines.</example>
    public string? Description { get; init; }

    /// <summary>The new priority level. Accepted values: Low, Medium, High.</summary>
    /// <example>Medium</example>
    public string? Priority { get; init; }

    /// <summary>The new due date (ISO 8601 date).</summary>
    /// <example>2026-08-15</example>
    public DateTime? DueDate { get; init; }

    /// <summary>The new assignee's user ID.</summary>
    /// <example>2</example>
    public int? AssigneeId { get; init; }

    /// <summary>Set to true to explicitly unassign the current assignee.</summary>
    /// <example>false</example>
    public bool ClearAssignee { get; init; } = false;

    /// <summary>Set to true to explicitly remove the due date.</summary>
    /// <example>false</example>
    public bool ClearDueDate { get; init; } = false;
}
