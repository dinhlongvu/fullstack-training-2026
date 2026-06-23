// Mapping/ProjectMappingProfile.cs
// AutoMapper profile for mapping between Project entity and ProjectListDto
// One profile per domain group. Registered automatically in Program.cs

using AutoMapper;
using Backend.Domain;
using Backend.DTOs;

namespace Backend.Mapping;

public class ProjectMappingProfile : Profile
{
    public ProjectMappingProfile()
    {
        // Map Project → ProjectListDto
        CreateMap<Project, ProjectListDto>()
            .ForCtorParam(
                "MemberCount", // ForCtorParam strictly requires the parameter name as a string
                opt => opt.MapFrom(src => src.Members.Count));
    }
}
