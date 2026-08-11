// Queries/Tasks/GetTaskCommentsQuery.cs

using AutoMapper;
using AutoMapper.QueryableExtensions;
using Backend.DTOs;
using Backend.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Backend.Queries.Tasks;

public record GetTaskCommentsQuery(
    int TaskId,
    int CurrentUserId
) : IRequest<GetTaskCommentsResult>;

public record GetTaskCommentsResult(
    bool IsTaskFound,
    bool IsAuthorized,
    List<CommentDto>? Data
);

public class GetTaskCommentsHandler : IRequestHandler<GetTaskCommentsQuery, GetTaskCommentsResult>
{
    private readonly AppDbContext _db;
    private readonly IMapper _mapper;

    public GetTaskCommentsHandler(AppDbContext db, IMapper mapper)
    {
        _db = db;
        _mapper = mapper;
    }

    public async Task<GetTaskCommentsResult> Handle(GetTaskCommentsQuery req, CancellationToken ct)
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
            return new GetTaskCommentsResult(false, false, null);

        if (!taskInfo.IsAuthorized)
            return new GetTaskCommentsResult(true, false, null);

        var comments = await _db.Comments
            .AsNoTracking()
            .Where(c => c.TaskId == req.TaskId)
            .OrderBy(c => c.CreatedAt)
            .ProjectTo<CommentDto>(_mapper.ConfigurationProvider)
            .ToListAsync(ct);

        return new GetTaskCommentsResult(true, true, comments);
    }
}
