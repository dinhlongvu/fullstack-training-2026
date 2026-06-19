// Services/Auth/ClaimsPrincipalExtensions.cs
// Extension methods for ClaimsPrincipal to easily extract user information from JWT claims.
// Centralizes token parsing logic for reusability across all protected endpoints.

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Backend.Exceptions;

namespace Backend.Services.Auth;

public static class ClaimsPrincipalExtensions
{
    // Extracts the user ID from the "sub" claim. 
    // Throws a consistent 401 UnauthorizedException if the token is missing or the sub claim is invalid.
    public static int GetUserId(this ClaimsPrincipal user)
    {
        var sub = user.FindFirstValue(JwtRegisteredClaimNames.Sub);

        if (string.IsNullOrEmpty(sub) || !int.TryParse(sub, out var userId))
        {
            // Forces the request through the ExceptionHandlingMiddleware
            throw new UnauthorizedException("Invalid token: missing subject claim");
        }

        return userId;
    }
}
