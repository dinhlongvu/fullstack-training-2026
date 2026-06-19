// DTOs/RefreshTokenResponseDto.cs
namespace Backend.DTOs;

public class RefreshTokenResponseDto
{
    // The newly issued short-lived JWT access token
    public string Token { get; set; } = string.Empty;

    // The newly issued long-lived opaque refresh token (Rotation)
    public string RefreshToken { get; set; } = string.Empty;
}
