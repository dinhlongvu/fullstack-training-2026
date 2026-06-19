// Commands/Auth/RefreshTokenHandler.cs
// Handles the refresh token exchange logic, applying the Token Rotation security pattern.
// Upgraded with Token Reuse Detection for maximum security.

using Backend.Domain;
using Backend.DTOs;
using Backend.Exceptions;
using Backend.Infrastructure.Data;
using Backend.Services.Auth;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace Backend.Commands.Auth;

public class RefreshTokenHandler : IRequestHandler<RefreshTokenCommand, RefreshTokenResponseDto>
{
    private readonly AppDbContext _db;
    private readonly ITokenService _tokenService;
    private readonly IConfiguration _configuration;

    public RefreshTokenHandler(AppDbContext db, ITokenService tokenService, IConfiguration config)
    {
        _db = db;
        _tokenService = tokenService;
        _configuration = config;
    }

    public async Task<RefreshTokenResponseDto> Handle(RefreshTokenCommand request, CancellationToken ct)
    {
        // 1. Hash the incoming plain text token to compare it securely with the Database
        var hashedInputToken = _tokenService.HashToken(request.RefreshToken);

        // 2. Find the token in the database. Include the associated User to generate a new JWT.
        var existingToken = await _db.RefreshTokens
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.TokenHash == hashedInputToken, ct);

        // 3. ADVANCED VALIDATION & SECURITY CHECKS
        // 3a. Token does not exist in the database at all
        // Throw a generic error message so attackers don't know exactly WHICH check failed.
        if (existingToken == null)
        {
            throw new UnauthorizedException("Invalid or expired refresh token");
        }

        // 3b. SECURITY ALERT: Token Reuse Detection (OAuth2 Best Practice)
        // If the token exists but was ALREADY REVOKED, it means someone (potentially an attacker) 
        // is trying to reuse a token that has already been rotated
        // Action: revoke ALL active refresh tokens for this user to lock down their account
        if (existingToken.RevokedAt != null)
        {
            // Find all tokens belonging to this user that are currently active
            var activeUserTokens = await _db.RefreshTokens
                .Where(rt => rt.UserId == existingToken.UserId && rt.RevokedAt == null)
                .ToListAsync(ct);

            // Revoke them all instantly
            foreach (var activeToken in activeUserTokens)
            {
                activeToken.RevokedAt = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync(ct);

            // Alert the system/user that a breach might have occurred
            throw new UnauthorizedException("Security alert: Token reuse detected. All sessions have been revoked. Please login again.");
        }

        // 3c. Token is expired
        if (DateTime.UtcNow > existingToken.ExpiresAt)
        {
            throw new UnauthorizedException("Invalid or expired refresh token");
        }

        // 4. SUCCESSFUL ROTATION PROCESS
        // 4a. Revoke the current valid token so it can never be used again
        existingToken.RevokedAt = DateTime.UtcNow;

        // 4b. Generate a brand new set of tokens (Access + Refresh)
        var newAccessToken = _tokenService.CreateAccessToken(existingToken.User);

        var plainNewRefreshToken = _tokenService.GenerateRefreshToken();
        var hashedNewRefreshToken = _tokenService.HashToken(plainNewRefreshToken);

        // 4c. Determine the lifespan of the new Refresh Token
        var expirationDaysStr = _configuration["Jwt:RefreshTokenExpirationDays"];
        if (!int.TryParse(expirationDaysStr, out int expirationDays))
        {
            expirationDays = 1; // Fallback to 1 day if config is missing or invalid
        }

        // 4d. Create the new Refresh Token entity
        var newRefreshTokenEntity = new RefreshToken
        {
            UserId = existingToken.UserId,
            TokenHash = hashedNewRefreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(expirationDays),
            CreatedAt = DateTime.UtcNow
        };

        _db.RefreshTokens.Add(newRefreshTokenEntity);

        // 4e. Save both the Revoked state of the old token and the creation of the new one
        // This runs in a single transaction by default in EF Core.
        await _db.SaveChangesAsync(ct);

        // 5. Return the new tokens to the client
        return new RefreshTokenResponseDto
        {
            Token = newAccessToken,
            RefreshToken = plainNewRefreshToken
        };
    }
}
