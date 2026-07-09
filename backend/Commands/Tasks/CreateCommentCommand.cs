// Commands/Tasks/CreateCommentCommand.cs

using Backend.DTOs;
using MediatR;

namespace Backend.Commands.Tasks;

public record CreateCommentRequest(string Content);

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
