// Services/Auth/JwtTokenService.cs
// Handles the generation of short-lived JWT access tokens and cryptographically secure long-lived refresh tokens.
// Extracted to a dedicated service to keep CQRS handlers thin, secure, and easily testable.

using Backend.Domain;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography; // Required for RandomNumberGenerator and SHA256
using System.Text;

namespace Backend.Services.Auth;

public interface ITokenService
{
    string CreateAccessToken(User user);
    string GenerateRefreshToken();
    string HashToken(string token);
}

public class JwtTokenService : ITokenService
{
    private readonly IConfiguration _configuration;

    public JwtTokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    /// <summary>
    /// Generates a short-lived JWT Access Token for the given user.
    /// </summary>
    public string CreateAccessToken(User user)
    {
        // 1. Retrieve the secret key from configuration safely
        var jwtKey = _configuration["Jwt:Key"];
        if (string.IsNullOrEmpty(jwtKey))
            throw new InvalidOperationException("JWT Secret Key is not configured.");

        var key = Encoding.UTF8.GetBytes(jwtKey);

        // 2. Read access token lifetime. 
        // Defensive programming: Fallback to 15 minutes if the config is missing, empty, or invalid.
        var expirationMinutesStr = _configuration["Jwt:AccessTokenExpirationMinutes"];
        if (!int.TryParse(expirationMinutesStr, out int expirationMinutes))
        {
            expirationMinutes = 1;
        }

        // 3. Define the token payload (Claims)
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                // The "sub" (subject) claim is the standard way to store the unique User ID
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email)
            }),

            // Set the exact expiration time dynamically based on the environment configuration
            Expires = DateTime.UtcNow.AddMinutes(expirationMinutes),
            Issuer = _configuration["Jwt:Issuer"],
            Audience = _configuration["Jwt:Audience"],

            // 4. Sign the token using HMAC SHA-256 for integrity verification
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(key),
                SecurityAlgorithms.HmacSha256Signature)
        };

        // 5. Build and serialize the token object into a compact string format
        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);

        // 6. Return the final token as a string
        return tokenHandler.WriteToken(token);
    }

    // Generates a cryptographically strong random string to be used as an opaque Refresh Token.
    public string GenerateRefreshToken()
    {
        // Allocate a 32-byte array (256 bits of entropy)
        var randomNumber = new byte[32];

        // Use a cryptographically secure random number generator (CSRNG) to fill the array.
        // This is strictly immune to prediction attacks, unlike the standard C# Random class.
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);

        // Convert the random bytes to a Base64 string so it can be safely sent via HTTP transport
        return Convert.ToBase64String(randomNumber);
    }

    // Hashes the plain text token using SHA-256 for secure database storage.
    // Ensures that even if the database is compromised, the original tokens remain hidden.
    public string HashToken(string token)
    {
        // Initialize the SHA-256 hashing algorithm
        using var sha256 = SHA256.Create();

        // Convert the plain string token into a byte array for processing
        var bytes = Encoding.UTF8.GetBytes(token);

        // Compute the one-way hash value
        var hash = sha256.ComputeHash(bytes);

        // Return the hashed bytes as a Base64 encoded string to store in the database
        return Convert.ToBase64String(hash);
    }
}
