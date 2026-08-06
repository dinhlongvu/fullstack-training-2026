// Commands/Tasks/CreateCommentCommand.cs

using Backend.DTOs;
using MediatR;

namespace Backend.Commands.Tasks;

/// <summary>
/// Request payload to add a comment to a task.
/// </summary>
public record CreateCommentRequest
{
    /// <summary>The text content of the comment (max 2000 characters).</summary>
    /// <example>This task is currently blocked by the API design review.</example>
    public string Content { get; init; } = string.Empty;
}

public record CreateCommentCommand(
    int TaskId,
    int CurrentUserId,
    string Content
) : IRequest<CreateCommentResult>;

public record CreateCommentResult(
    bool IsTaskFound,
    bool IsAuthorized,
    CommentDto? Data
);
