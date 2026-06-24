// Queries/Projects/GetProjectDetail.cs
// Read operations (Queries) use the 1-file convention. 
// Handlers return a custom result object to elegantly handle 404 and 403 without throwing exceptions.

using AutoMapper;
using AutoMapper.QueryableExtensions; // Required for ProjectTo extension method
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
        // Use ProjectTo to let AutoMapper automatically analyze the DTO structure and force Entity Framework
        // Generate a SQL SELECT statement that only retrieves the CORRECT columns needed
        // Completely remove .Include() because AutoMapper understands and handles JOIN at the Database level
        var dto = await _db.Projects
            .Where(p => p.Id == req.ProjectId)
            .ProjectTo<ProjectDetailDto>(_mapper.ConfigurationProvider)
            .FirstOrDefaultAsync(ct);

        // 1. Check 404 not found project
        // If the project does not exist, return null
        if (dto == null)
        {
            return new ProjectDetailResult(false, false, null);
        }

        // 2. Check 403 Forbidden (Authorization logic)
        // Because dto already contains the Members array (automatically mapped by ProjectTo), check the permissions directly on the DTO
        bool isAuthorized = dto.CreatedById == req.UserId || dto.Members.Any(m => m.UserId == req.UserId);
        if (!isAuthorized)
        {
            return new ProjectDetailResult(true, false, null);
        }

        // 3. Return 200 OK
        return new ProjectDetailResult(true, true, dto);
    }
}
