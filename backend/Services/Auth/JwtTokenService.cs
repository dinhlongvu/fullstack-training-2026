// Services/Auth/JwtTokenService.cs
// Handles the generation of JWT access tokens.
// Extracted to a dedicated service to keep CQRS handlers thin and testable.

using Backend.Domain;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Backend.Services.Auth;

public interface ITokenService
{
    string CreateAccessToken(User user);
}

public class JwtTokenService : ITokenService
{
    private readonly IConfiguration _configuration;

    public JwtTokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string CreateAccessToken(User user)
    {
        // Initialize the JWT Token creation process
        var jwtKey = _configuration["Jwt:Key"];

        if (string.IsNullOrEmpty(jwtKey))
        {
            throw new InvalidOperationException("JWT Secret Key is not configured");
        }

        var key = Encoding.UTF8.GetBytes(jwtKey);

        // Read token lifetime from configuration settings, default to 60 minutes if fallback occurs
        var expirationMinutesStr = _configuration["Jwt:AccessTokenExpirationMinutes"];
        if (!double.TryParse(expirationMinutesStr, out double expirationMinutes))
        {
            expirationMinutes = 60; // If the config file is corrupted, the default is 60 minutes
        }

        // Define the content (Payload) of the Token
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email)
            }),
            // Use dynamic configuration expiration instead of hardcoded hours values
            Expires = DateTime.UtcNow.AddMinutes(expirationMinutes),
            Issuer = _configuration["Jwt:Issuer"],
            Audience = _configuration["Jwt:Audience"],
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(key),
                SecurityAlgorithms.HmacSha256Signature) // HS256 encryption algorithm to create Signature
        };

        // Sign and create Token 
        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);

        return tokenHandler.WriteToken(token);
    }
}
