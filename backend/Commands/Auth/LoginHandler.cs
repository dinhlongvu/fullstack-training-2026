// Commands/Auth/LoginHandler.cs
// Handles user authentication, generates both JWT access token and opaque refresh token.
// Now extremely thin and clean by utilizing the DRY helper from ITokenService.

using AutoMapper;
using Backend.Domain;
using Backend.DTOs;
using Backend.Exceptions;
using Backend.Infrastructure.Data;
using Backend.Services.Auth;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Backend.Commands.Auth;

public class LoginHandler : IRequestHandler<LoginCommand, LoginResponseDto>
{
    private readonly AppDbContext _db;
    private readonly IMapper _mapper;
    private readonly ITokenService _tokenService;

    public LoginHandler(AppDbContext db, IMapper mapper, ITokenService tokenService)
    {
        _db = db;
        _mapper = mapper;
        _tokenService = tokenService;
    }

    public async Task<LoginResponseDto> Handle(LoginCommand cmd, CancellationToken ct)
    {
        // 1. Standardize Email for comparison
        var normalizedEmail = cmd.Email.Trim().ToLowerInvariant();

        // 2. Find user in database and verify password
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Email == normalizedEmail, ct);

        // Throw a generic error to avoid Hackers scanning emails (User Enumeration)
        if (user == null || !BCrypt.Net.BCrypt.Verify(cmd.Password, user.PasswordHash))
        {
            throw new UnauthorizedException("Invalid email or password");
        }

        // 3. Generate short-lived Access Token (JWT)
        var accessToken = _tokenService.CreateAccessToken(user);

        // 4. Generate Refresh Token using the DRY helper method from ITokenService
        // This handles random generation, SHA-256 hashing, and config reading all at once.
        var refreshTokenInfo = _tokenService.CreateRefreshTokenEntity(user.Id);

        // 5. Persist the newly created refresh token entity to the database
        _db.RefreshTokens.Add(refreshTokenInfo.Entity);
        await _db.SaveChangesAsync(ct);

        // 6. Map the User Entity to UserDto using AutoMapper (hiding the password hash)
        var userProfile = _mapper.Map<UserDto>(user);

        // 7. Return the login response including the plain text Refresh Token (returned ONLY ONCE here)
        return new LoginResponseDto
        {
            Token = accessToken,
            RefreshToken = refreshTokenInfo.PlainToken,
            User = userProfile
        };
    }
}
