// Commands/Auth/RefreshTokenCommand.cs
// CQRS Command representing the token refresh request

using Backend.DTOs;
using FluentValidation;
using MediatR;

namespace Backend.Commands.Auth;

// The request payload expecting only the refresh token string
public record RefreshTokenCommand(
    string RefreshToken
) : IRequest<RefreshTokenResponseDto>;

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
