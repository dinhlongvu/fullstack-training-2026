// Commands/Auth/RefreshTokenCommand.cs
// CQRS Command representing the token refresh request

using Backend.DTOs;
using FluentValidation;
using MediatR;

namespace Backend.Commands.Auth;

/// <summary>
/// Request payload to exchange a refresh token for a new access token.
/// </summary>
public record RefreshTokenCommand : IRequest<RefreshTokenResponseDto>
{
    /// <summary>The refresh token received from a previous login or refresh call.</summary>
    /// <example>eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</example>
    public string RefreshToken { get; init; } = string.Empty;
}

// FluentValidation rule to ensure the refresh token is provided
public class RefreshTokenCommandValidator : AbstractValidator<RefreshTokenCommand>
{
    public RefreshTokenCommandValidator()
    {
        RuleFor(x => x.RefreshToken)
            .NotEmpty()
            .WithMessage("Refresh token is required.");
    }
}
