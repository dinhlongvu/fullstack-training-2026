// Commands/Tasks/DeleteCommentHandler.cs

using Backend.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Backend.Commands.Tasks;

public class DeleteCommentHandler : IRequestHandler<DeleteCommentCommand>
{
    private readonly AppDbContext _db;

    public DeleteCommentHandler(AppDbContext db)
    {
        _db = db;
    }

    public async Task Handle(DeleteCommentCommand req, CancellationToken ct)
    {
        var comment = await _db.Comments
            .Include(c => c.Task)
                .ThenInclude(t => t.Project)
            .FirstOrDefaultAsync(c => c.Id == req.CommentId && c.TaskId == req.TaskId, ct);

        if (comment == null)
            throw new KeyNotFoundException("Comment not found.");

        bool isAuthor = comment.AuthorId == req.CurrentUserId;
        bool isProjectOwner = comment.Task.Project.CreatedById == req.CurrentUserId;

        if (!isAuthor && !isProjectOwner)
            throw new UnauthorizedAccessException("You are not authorized to delete this comment.");

        _db.Comments.Remove(comment);
        await _db.SaveChangesAsync(ct);
    }
}
