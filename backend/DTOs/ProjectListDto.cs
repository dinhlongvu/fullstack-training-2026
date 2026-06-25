// DTOs/ProjectListDto.cs
// DTO for GET /api/projects response.
// NEVER expose the Entity directly. Always map Entity → DTO.

namespace Backend.DTOs;

public record ProjectListDto(
    int Id,
    string Name,
    string Description,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    int MemberCount  // Flattened from Project.Members.Count
);
