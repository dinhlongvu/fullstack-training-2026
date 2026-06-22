// Commands/Auth/LoginCommand.cs
// CQRS Command representing the login request data

using Backend.DTOs;
using MediatR;

namespace Backend.Commands.Auth;

public record LoginCommand(
    string Email,
    string Password
) : IRequest<LoginResponseDto>;
