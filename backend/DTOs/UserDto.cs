// DTOs/UserDto.cs
// Response DTO for auth endpoints
// Only return safe fields and never expose PasswordHash

namespace Backend.DTOs;

public record UserDto(
    int Id,
    string Email,
    string FullName
);
