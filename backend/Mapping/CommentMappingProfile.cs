// Mapping/CommentMappingProfile.cs

using AutoMapper;
using Backend.Domain;
using Backend.DTOs;

namespace Backend.Mapping;

public class CommentMappingProfile : Profile
{
    public CommentMappingProfile()
    {
        CreateMap<Comment, CommentDto>()
            .ForMember(dest => dest.AuthorName, opt => opt.MapFrom(src => src.Author.FullName));
    }
}
