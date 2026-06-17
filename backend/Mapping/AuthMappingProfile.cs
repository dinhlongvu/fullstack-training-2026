// Mapping/AuthMappingProfile.cs
// AutoMapper profile for mapping between User entity and UserDto
// One profile per domain group. Registered automatically in Program.cs

using AutoMapper;
using Backend.Domain;
using Backend.DTOs;

namespace Backend.Mapping;

public class AuthMappingProfile : Profile
{
    public AuthMappingProfile()
    {
        // Map User entity to UserDto for API responses 
        // Never expose PasswordHash to client
        // Map User → UserDto (for API responses)
        CreateMap<User, UserDto>();
    }
}
