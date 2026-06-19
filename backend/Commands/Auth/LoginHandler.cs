// Commands/Auth/LoginHandler.cs
// Handles user authentication, generates both JWT access token and opaque refresh token.

using AutoMapper;
using Backend.Domain;
using Backend.DTOs;
using Backend.Exceptions;
using Backend.Infrastructure.Data;
using Backend.Services.Auth;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace Backend.Commands.Auth;

public class LoginHandler : IRequestHandler<LoginCommand, LoginResponseDto>
{
    private readonly AppDbContext _db;
    private readonly IMapper _mapper;
    private readonly ITokenService _tokenService;
    private readonly IConfiguration _configuration;

    public LoginHandler(AppDbContext db, IMapper mapper, ITokenService tokenService, IConfiguration configuration)
    {
        _db = db;
        _mapper = mapper;
        _tokenService = tokenService;
        _configuration = configuration;
    }

    public async Task<LoginResponseDto> Handle(LoginCommand cmd, CancellationToken ct)
    {
        // 1. Standardize Email for comparison
        var normalizedEmail = cmd.Email.Trim().ToLowerInvariant();

        // 2. Find user in database and verify password
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Email == normalizedEmail, ct);

        // Throw a general error to avoid Hackers scanning emails (User Enumeration)
        if (user == null || !BCrypt.Net.BCrypt.Verify(cmd.Password, user.PasswordHash))
        {
            throw new UnauthorizedException("Invalid email or password");
        }

        // 3. Generate short-lived Access Token (JWT)
        var accessToken = _tokenService.CreateAccessToken(user);

        // 4. Generate cryptographically secure Refresh Token and its Hash
        var plainRefreshToken = _tokenService.GenerateRefreshToken();
        var hashedRefreshToken = _tokenService.HashToken(plainRefreshToken);

        // Determine refresh token expiration (fallback to 1 day if config is missing)
        var expirationDaysStr = _configuration["Jwt:RefreshTokenExpirationDays"];
        if (!int.TryParse(expirationDaysStr, out int expirationDays))
        {
            expirationDays = 1;
        }

        // 5. Persist the hashed refresh token to the database
        var refreshTokenEntity = new RefreshToken
        {
            UserId = user.Id,
            TokenHash = hashedRefreshToken, // SECURITY: Never store plain text tokens!
            ExpiresAt = DateTime.UtcNow.AddDays(expirationDays),
            CreatedAt = DateTime.UtcNow
        };

        _db.RefreshTokens.Add(refreshTokenEntity);
        await _db.SaveChangesAsync(ct);

        // 6. Map the User Entity to UserDto using AutoMapper
        var userProfile = _mapper.Map<UserDto>(user);

        // 7. Return both tokens and user profile
        return new LoginResponseDto
        {
            Token = accessToken,
            RefreshToken = plainRefreshToken,
            User = userProfile
        };
    }
}
