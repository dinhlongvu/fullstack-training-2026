// Commands/Auth/LoginCommand.cs
// CQRS Command representing the login request data

using Backend.DTOs;
using MediatR;

namespace Backend.Commands.Auth;

/// <summary>
/// Request payload for user login.
/// </summary>
public record LoginCommand : IRequest<LoginResponseDto>
{
    /// <summary>The user's email address.</summary>
    /// <example>user@gmail.com</example>
    public string Email { get; init; } = string.Empty;

    /// <summary>The user's password.</summary>
    /// <example>StrongPass!123</example>
    public string Password { get; init; } = string.Empty;
}
