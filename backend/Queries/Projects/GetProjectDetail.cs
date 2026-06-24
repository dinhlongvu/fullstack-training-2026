// Queries/Projects/GetProjectDetail.cs
// Read operations (Queries) use the 1-file convention. 
// Handlers return a custom result object to elegantly handle 404 and 403 without throwing exceptions.

using AutoMapper;
using Backend.Domain;
using Backend.DTOs;
using Backend.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Backend.Queries.Projects;

// 1. Query Record: only contains input data needed to retrieve project details
public record GetProjectDetailQuery(int ProjectId, int UserId) : IRequest<ProjectDetailResult>;

// 2. Result Wrapper for control flow
// - IsFound: whether the project exists or not
// - IsAuthorized: whether the current user has permission to view or not
// - Data: detailed project data if valid
public record ProjectDetailResult(bool IsFound, bool IsAuthorized, ProjectDetailDto? Data);

// 3. Query Handler
public class GetProjectDetailHandler : IRequestHandler<GetProjectDetailQuery, ProjectDetailResult>
{
    private readonly AppDbContext _db;
    private readonly IMapper _mapper;

    public GetProjectDetailHandler(AppDbContext db, IMapper mapper)
    {
        _db = db;
        _mapper = mapper;
    }

    public async Task<ProjectDetailResult> Handle(GetProjectDetailQuery req, CancellationToken ct)
    {
        // Use AsNoTracking for read-only performance optimization
        // Include/ThenInclude to get members and related user information
        var project = await _db.Projects
            .Include(p => p.Members)
                .ThenInclude(m => m.User) // Join across 3 tables to get Email and FullName
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == req.ProjectId, ct);

        if (project == null)
        {
            return new ProjectDetailResult(false, false, null);
        }

        // Authorization Rule: Only the creator OR an existing member can view
        bool isAuthorized = project.CreatedById == req.UserId || project.Members.Any(m => m.UserId == req.UserId);

        // There is a project but the user does not have access
        if (!isAuthorized)
        {
            return new ProjectDetailResult(true, false, null);
        }

        var dto = _mapper.Map<ProjectDetailDto>(project);
        return new ProjectDetailResult(true, true, dto);
    }
}
