// DTOs/LoginResponseDto.cs
// Response DTO for the login endpoint
// Groups the generated JWT token and the safe user profile (without PasswordHash)

namespace Backend.DTOs;

// Use record to ensure immutability for returned data
public record LoginResponseDto(
    string Token,
    UserDto User
);
