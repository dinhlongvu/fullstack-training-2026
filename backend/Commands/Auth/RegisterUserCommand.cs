// Commands/Auth/RegisterUserCommand.cs
// CQRS command for user registration
// Combines request DTO and command into one record

using Backend.DTOs;
using MediatR;

namespace Backend.Commands.Auth;

public record RegisterUserCommand(
    string Email,
    string Password,
    string FullName
) : IRequest<UserDto>; // Command returns UserDto on success
