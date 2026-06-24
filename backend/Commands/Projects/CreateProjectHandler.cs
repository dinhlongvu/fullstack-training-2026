// Commands/Projects/CreateProjectHandler.cs

using AutoMapper;
using Backend.Domain;
using Backend.DTOs;
using Backend.Infrastructure.Data;
using MediatR;

namespace Backend.Commands.Projects;

public class CreateProjectHandler : IRequestHandler<CreateProjectCommand, ProjectDto>
{
    private readonly AppDbContext _db;
    private readonly IMapper _mapper;

    public CreateProjectHandler(AppDbContext db, IMapper mapper)
    {
        _db = db;
        _mapper = mapper;
    }

    public async Task<ProjectDto> Handle(CreateProjectCommand cmd, CancellationToken ct)
    {
        // Init Entity manually to maintain strict domain integrity
        var project = new Project
        {
            Name = cmd.Name,
            Description = cmd.Description,
            CreatedAt = DateTime.UtcNow,
            CreatedById = cmd.UserId,

            // Auto-add creator to ProjectMembers list immediately
            // Initializing the list here ensures a project cannot exist without members
            Members = new List<ProjectMember>
            {
                new ProjectMember
                {
                    UserId = cmd.UserId,
                    JoinedAt = DateTime.UtcNow
                }
            }
        };

        _db.Projects.Add(project);
        await _db.SaveChangesAsync(ct);

        return _mapper.Map<ProjectDto>(project);
    }
}
