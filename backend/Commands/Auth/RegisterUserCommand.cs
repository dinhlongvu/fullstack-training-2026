// Commands/Auth/RegisterUserCommand.cs
// CQRS command for user registration

using Backend.DTOs;
using MediatR;

namespace Backend.Commands.Auth;

/// <summary>
/// Command to register a new user in the system.
/// </summary>
public record RegisterUserCommand : IRequest<UserDto>
{
    /// <summary>The user's email address.</summary>
    /// <example>user@gmail.com</example>
    public string Email { get; init; } = string.Empty;

    /// <summary>The user's password (min 8 chars, requires uppercase, digit, and special char).</summary>
    /// <example>StrongPass!123</example>
    public string Password { get; init; } = string.Empty;

    /// <summary>The user's full name.</summary>
    /// <example>John Doe</example>
    public string FullName { get; init; } = string.Empty;
}
