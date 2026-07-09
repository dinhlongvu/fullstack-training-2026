// Commands/Tasks/CreateCommentHandler.cs

using AutoMapper;
using Backend.Domain;
using Backend.DTOs;
using Backend.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Backend.Commands.Tasks;

public class CreateCommentHandler : IRequestHandler<CreateCommentCommand, CreateCommentResult>
{
    private readonly AppDbContext _db;
    private readonly IMapper _mapper;

    public CreateCommentHandler(AppDbContext db, IMapper mapper)
    {
        _db = db;
        _mapper = mapper;
    }

    public async Task<CreateCommentResult> Handle(CreateCommentCommand req, CancellationToken ct)
    {
        var taskInfo = await _db.Tasks
            .AsNoTracking()
            .Where(t => t.Id == req.TaskId)
            .Select(t => new
            {
                t.Id,
                IsAuthorized = t.Project.CreatedById == req.CurrentUserId ||
                               t.Project.Members.Any(m => m.UserId == req.CurrentUserId)
            })
            .FirstOrDefaultAsync(ct);

        if (taskInfo == null)
            return new CreateCommentResult(false, false, null);

        if (!taskInfo.IsAuthorized)
            return new CreateCommentResult(true, false, null);

        var comment = new Comment
        {
            TaskId = req.TaskId,
            AuthorId = req.CurrentUserId,
            Content = req.Content.Trim()
        };

        _db.Set<Comment>().Add(comment);
        await _db.SaveChangesAsync(ct);

        var savedComment = await _db.Set<Comment>()
            .Include(c => c.Author)
            .FirstAsync(c => c.Id == comment.Id, ct);

        var dto = _mapper.Map<CommentDto>(savedComment);

        return new CreateCommentResult(true, true, dto);
    }
}
