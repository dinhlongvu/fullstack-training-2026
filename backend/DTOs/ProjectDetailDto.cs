// DTOs/ProjectDetailDto.cs
// DTOs specifically tailored for the detail view, including nested flattened objects

namespace Backend.DTOs;

public record ProjectMemberDto(
    int UserId,
    string Email,
    string FullName,
    DateTime JoinedAt
);

public record ProjectDetailDto(
    int Id,
    string Name,
    string? Description,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    int CreatedById,
    List<ProjectMemberDto> Members
);
