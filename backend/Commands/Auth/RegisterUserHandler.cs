// Commands/Auth/RegisterUserHandler.cs
// CQRS Handler for registration command
// Validates email uniqueness, hashes password, saves user, returns DTO.

using Backend.Commands.Auth;
using Backend.Domain;
using Backend.DTOs;
using Backend.Exceptions;
using Backend.Infrastructure.Data;
using AutoMapper;
using BCrypt.Net;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Backend.Commands.Auth;

public class RegisterUserHandler : IRequestHandler<RegisterUserCommand, UserDto>
{
    private readonly AppDbContext _db;
    private readonly IMapper _mapper;

    public RegisterUserHandler(AppDbContext db, IMapper mapper)
    {
        _db = db;
        _mapper = mapper;
    }

    public async Task<UserDto> Handle(RegisterUserCommand cmd, CancellationToken ct)
    {
        // Validation runs automatically via MediatR pipeline behavior

        // Mormalize email: trim and convert to lowercase for uniqueness check
        var normalizedEmail = cmd.Email.Trim().ToLowerInvariant();

        // Check if email already exists in database
        var existingUser = await _db.Users
            .FirstOrDefaultAsync(u => u.Email == normalizedEmail, ct);

        if (existingUser != null)
        {
            throw new ConflictException("Email is already registered.");
        }

        // Hash the password using BCrypt
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(cmd.Password);

        // Create new user entity
        var user = new User
        {
            Email = normalizedEmail,
            FullName = cmd.FullName.Trim(),
            PasswordHash = passwordHash,
            CreatedAt = DateTime.UtcNow
        };
        // Save user to database
        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);

        // Map entity to DTO and return
        return _mapper.Map<UserDto>(user);
    }
}
