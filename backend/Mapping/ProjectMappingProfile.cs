// Mapping/ProjectMappingProfile.cs
// AutoMapper profile for mapping between Project entity and Project DTOs.
// One profile per domain group. Registered automatically in Program.cs.

using AutoMapper;
using Backend.Domain;
using Backend.DTOs;

namespace Backend.Mapping;

public class ProjectMappingProfile : Profile
{
    public ProjectMappingProfile()
    {
        // Map for list view
        CreateMap<Project, ProjectListDto>()
            .ForCtorParam(
                "MemberCount", // ForCtorParam strictly requires the parameter name as a string
                opt => opt.MapFrom(src => src.Members.Count));

        // Map for single project response
        CreateMap<Project, ProjectDto>();
    }
}
