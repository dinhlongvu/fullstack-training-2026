// DTOs/ProjectDto.cs
namespace Backend.DTOs;

public record ProjectDto(
    int Id,
    string Name,
    string Description,
    DateTime CreatedAt,
    int CreatedById
);
