// Commands/Tasks/DeleteCommentHandler.cs

using Backend.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Backend.Commands.Tasks;

public class DeleteCommentHandler : IRequestHandler<DeleteCommentCommand, DeleteCommentResult>
{
    private readonly AppDbContext _db;

    public DeleteCommentHandler(AppDbContext db)
    {
        _db = db;
    }

    public async Task<DeleteCommentResult> Handle(DeleteCommentCommand req, CancellationToken ct)
    {
        var comment = await _db.Comments
            .Include(c => c.Task).ThenInclude(t => t.Project)
            .FirstOrDefaultAsync(c => c.Id == req.CommentId && c.TaskId == req.TaskId, ct);

        if (comment == null)
            return new DeleteCommentResult(false, false);

        bool isAuthor = comment.AuthorId == req.CurrentUserId;
        bool isProjectOwner = comment.Task.Project.CreatedById == req.CurrentUserId;

        if (!isAuthor && !isProjectOwner)
            return new DeleteCommentResult(true, false);

        _db.Comments.Remove(comment);
        await _db.SaveChangesAsync(ct);

        return new DeleteCommentResult(true, true);
    }
}
