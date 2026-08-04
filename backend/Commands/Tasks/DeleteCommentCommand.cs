// Commands/Tasks/DeleteCommentCommand.cs

using MediatR;

namespace Backend.Commands.Tasks;

public record DeleteCommentCommand(
    int TaskId,
    int CommentId,
    int CurrentUserId
) : IRequest<DeleteCommentResult>;

public record DeleteCommentResult(
    bool IsCommentFound,
    bool IsAuthorized
);
