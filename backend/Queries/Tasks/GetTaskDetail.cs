// Queries/Tasks/GetTaskDetail.cs

using AutoMapper;
using AutoMapper.QueryableExtensions;
using Backend.DTOs;
using Backend.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Backend.Queries.Tasks;

// 1. Query & Result Records
public record GetTaskDetailQuery(
    int TaskId,
    int CurrentUserId
) : IRequest<GetTaskDetailResult>;

public record GetTaskDetailResult(
    bool IsTaskFound,
    bool IsAuthorized,
    TaskDto? Data
);

// 2. Handler
public class GetTaskDetailHandler : IRequestHandler<GetTaskDetailQuery, GetTaskDetailResult>
{
    private readonly AppDbContext _db;
    private readonly IMapper _mapper;

    public GetTaskDetailHandler(AppDbContext db, IMapper mapper)
    {
        _db = db;
        _mapper = mapper;
    }

    public async Task<GetTaskDetailResult> Handle(GetTaskDetailQuery req, CancellationToken ct)
    {
        var authCheck = await _db.Tasks
            .Where(t => t.Id == req.TaskId)
            .Select(t => new
            {
                IsFound = true,
                HasAccess = t.Project.CreatedById == req.CurrentUserId
                            || t.Project.Members.Any(m => m.UserId == req.CurrentUserId)
            })
            .FirstOrDefaultAsync(ct);

        if (authCheck == null)
        {
            return new GetTaskDetailResult(false, false, null);
        }

        if (!authCheck.HasAccess)
        {
            return new GetTaskDetailResult(true, false, null);
        }

        var taskDto = await _db.Tasks
            .Where(t => t.Id == req.TaskId)
            .ProjectTo<TaskDto>(_mapper.ConfigurationProvider)
            .FirstOrDefaultAsync(ct);

        return new GetTaskDetailResult(true, true, taskDto);
    }
}
