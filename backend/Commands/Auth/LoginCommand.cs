// Commands/Auth/LoginCommand.cs
// CQRS Command and Handler for user authentication
// Verifies credentials against the DB and generates a signed JWT token

using Backend.Domain;
using Backend.DTOs;
using Backend.Exceptions;
using Backend.Infrastructure.Data;
using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

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
    private readonly IConfiguration _configuration;

    // Constructor for Dependency Injection
    public LoginHandler(AppDbContext db, IMapper mapper, IConfiguration configuration)
    {
        _db = db;
        _mapper = mapper;
        _configuration = configuration;
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

        // 4. Initialize the JWT Token creation process
        var tokenHandler = new JwtSecurityTokenHandler();
        var jwtKey = _configuration["Jwt:Key"];

        if (string.IsNullOrEmpty(jwtKey))
        {
            throw new InvalidOperationException("JWT Secret Key is not configured");
        }

        var key = Encoding.UTF8.GetBytes(jwtKey);

        // Define the content (Payload) of the Token
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email)
            }),
            Expires = DateTime.UtcNow.AddHours(24), // Token expires in 24 Hours
            Issuer = _configuration["Jwt:Issuer"],
            Audience = _configuration["Jwt:Audience"],
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(key),
                SecurityAlgorithms.HmacSha256Signature) // HS256 encryption algorithm to create Signature
        };

        // 5. Sign and create Token 
        var token = tokenHandler.CreateToken(tokenDescriptor);
        var tokenString = tokenHandler.WriteToken(token);

        // 6. Map the User Entity to UserDto to hide PasswordHash
        var userProfile = _mapper.Map<UserDto>(user);

        // 7. Return Login Response (Token + User Profile)
        return new LoginResponseDto(tokenString, userProfile);
    }
}
