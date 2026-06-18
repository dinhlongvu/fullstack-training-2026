// Commands/Auth/LoginCommand.cs
// CQRS Command and Handler for user authentication
// Verifies credentials against the DB and generates a signed JWT token

using Backend.Domain;
using Backend.DTOs;
using Backend.Exceptions;
using Backend.Infrastructure.Data;
using Backend.Services.Auth; // Added to use ITokenService
using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Backend.Commands.Auth;

// 1. Command record represents Request body
public record LoginCommand(
    string Email,
    string Password
) : IRequest<LoginResponseDto>;

// 2. Handler contains Business Logic
public class LoginHandler : IRequestHandler<LoginCommand, LoginResponseDto>
{
    private readonly AppDbContext _db;
    private readonly IMapper _mapper;
    private readonly ITokenService _tokenService;

    // Constructor for Dependency Injection
    public LoginHandler(AppDbContext db, IMapper mapper, ITokenService tokenService)
    {
        _db = db;
        _mapper = mapper;
        _tokenService = tokenService;
    }

    // The core business logic
    public async Task<LoginResponseDto> Handle(LoginCommand cmd, CancellationToken ct)
    {
        // 1. Standardize Email for comparison
        var normalizedEmail = cmd.Email.Trim().ToLowerInvariant();

        // 2. Find user in database
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Email == normalizedEmail, ct);

        // Throw a general error to avoid Hackers scanning emails (User Enumeration)
        if (user == null)
        {
            throw new UnauthorizedException("Invalid email or password");
        }

        // 3. Compare the entered password with the hash code stored in the Database
        bool isPasswordValid = BCrypt.Net.BCrypt.Verify(cmd.Password, user.PasswordHash);

        if (!isPasswordValid)
        {
            throw new UnauthorizedException("Invalid email or password");
        }

        // 4. Generate JWT Token using the dedicated service
        var tokenString = _tokenService.CreateAccessToken(user);

        // 5. Map the User Entity to UserDto to hide PasswordHash
        var userProfile = _mapper.Map<UserDto>(user);

        // 6. Return Login Response (Token + User Profile)
        return new LoginResponseDto(tokenString, userProfile);
    }
}
