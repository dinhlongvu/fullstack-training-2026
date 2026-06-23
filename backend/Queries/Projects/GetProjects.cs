// Queries/Projects/GetProjects.cs
// CQRS Query: ONE file = Query record + Handler.
// Queries only READ data — no side effects, no SaveChanges.

using AutoMapper;
using AutoMapper.QueryableExtensions;
using Backend.DTOs;
using Backend.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Backend.Queries.Projects;

// 1. CQRS Query Record (The Request Object)
// Carries the authenticated user's ID to filter accessible projects.
public record GetProjectsQuery(int UserId) : IRequest<List<ProjectListDto>>;

// 2. CQRS Query Handler (The Read-Only Logic)
// Fetches all projects where the user is either the creator (owner) or a team member.
public class GetProjectsHandler : IRequestHandler<GetProjectsQuery, List<ProjectListDto>>
{
    private readonly AppDbContext _db;
    private readonly IMapper _mapper;

    // Inject AppDbContext for DB access and IMapper for DTO projection configurations
    public GetProjectsHandler(AppDbContext db, IMapper mapper)
    {
        _db = db;
        _mapper = mapper;
    }

    public async Task<List<ProjectListDto>> Handle(GetProjectsQuery q, CancellationToken ct)
    {
        return await _db.Projects
            // PERMISSION FILTER: Only fetch projects linked to this user
            // Case A: User is the original creator (Owner)
            // Case B: OR User is explicitly added inside the project's 'Members' relational table
            .Where(p => p.CreatedById == q.UserId // owner
                     || p.Members.Any(m => m.UserId == q.UserId)) // member 

            // Sort by latest projects first
            .OrderByDescending(p => p.CreatedAt)

            // PERFORMANCE OPTIMIZATION: LINQ Projection via AutoMapper
            // ProjectTo<> converts the LINQ query into an optimized SQL SELECT statement before hitting the DB.
            // This ensures Entity Framework ONLY requests columns mapped inside 'ProjectListDto' (Avoids SELECT *).
            // It also bypasses EF tracking mechanism automatically for better query performance.
            .ProjectTo<ProjectListDto>(_mapper.ConfigurationProvider)

            // Execute the optimized query asynchronously and fetch the list
            .ToListAsync(ct);
    }
}
