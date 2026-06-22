// Commands/Auth/RefreshTokenHandler.cs
// Handles the refresh token exchange logic, applying the Token Rotation security pattern.
// Upgraded with Token Reuse Detection for maximum security and refactored for DRY principles.

using Backend.Domain;
using Backend.DTOs;
using Backend.Exceptions;
using Backend.Infrastructure.Data;
using Backend.Services.Auth;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Backend.Commands.Auth;

public class RefreshTokenHandler : IRequestHandler<RefreshTokenCommand, RefreshTokenResponseDto>
{
    private readonly AppDbContext _db;
    private readonly ITokenService _tokenService;

    public RefreshTokenHandler(AppDbContext db, ITokenService tokenService)
    {
        _db = db;
        _tokenService = tokenService;
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
        if (existingToken == null)
        {
            throw new UnauthorizedException("Invalid or expired refresh token");
        }

        // 3b. SECURITY ALERT: Token Reuse Detection (OAuth2 Best Practice)
        // If the token exists but was ALREADY REVOKED, it means someone is trying to reuse a rotated token.
        // Action: revoke ALL active refresh tokens for this user to lock down their account.
        if (existingToken.RevokedAt != null)
        {
            var activeUserTokens = await _db.RefreshTokens
                .Where(rt => rt.UserId == existingToken.UserId && rt.RevokedAt == null)
                .ToListAsync(ct);

            foreach (var activeToken in activeUserTokens)
            {
                activeToken.RevokedAt = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync(ct);

            // FIXED: Return a generic message identical to other error branches.
            // This prevents attackers from knowing whether the token was simply invalid or actively revoked.
            throw new UnauthorizedException("Invalid or expired refresh token");
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

        // DRY: Use the helper method from ITokenService to handle generation, hashing, and config at once.
        var newRefreshTokenInfo = _tokenService.CreateRefreshTokenEntity(existingToken.UserId);

        // 4c. Add the new token entity to the tracking context
        _db.RefreshTokens.Add(newRefreshTokenInfo.Entity);

        // 4d. Save both the Revoked state of the old token and the creation of the new one atomically
        await _db.SaveChangesAsync(ct);

        // 5. Return the new tokens to the client
        return new RefreshTokenResponseDto
        {
            Token = newAccessToken,
            RefreshToken = newRefreshTokenInfo.PlainToken
        };
    }
}
