// DTOs/LoginResponseDto.cs
// Response DTO for the login endpoint
// Groups the generated JWT token and the safe user profile (without PasswordHash)

namespace Backend.DTOs;

public class LoginResponseDto
{
    // The short-lived JWT access token
    public string Token { get; set; } = string.Empty;

    // The long-lived opaque refresh token used to get new access tokens
    public string RefreshToken { get; set; } = string.Empty;

    public UserDto User { get; set; } = null!;
}
