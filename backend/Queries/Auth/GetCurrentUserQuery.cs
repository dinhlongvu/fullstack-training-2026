// Queries/Auth/GetCurrentUserQuery.cs
// CQRS Query and Handler to retrieve the current authenticated user's profile

using Backend.DTOs;
using Backend.Exceptions;
using Backend.Infrastructure.Data;
using AutoMapper;
using MediatR;

namespace Backend.Queries.Auth;

// 1. Query record (Input: User ID extracted from the JWT token)
public record GetCurrentUserQuery(int UserId) : IRequest<UserDto>;

// 2. Handler contains Business Logic
public class GetCurrentUserHandler : IRequestHandler<GetCurrentUserQuery, UserDto>
{
    private readonly AppDbContext _db;
    private readonly IMapper _mapper;

    public GetCurrentUserHandler(AppDbContext db, IMapper mapper)
    {
        _db = db;
        _mapper = mapper;
    }

    public async Task<UserDto> Handle(GetCurrentUserQuery query, CancellationToken ct)
    {
        // Find the user by ID
        var user = await _db.Users.FindAsync(new object[] { query.UserId }, ct);

        // If the token is valid but the user was deleted from DB, return 401
        if (user == null)
        {
            throw new UnauthorizedException("User not found or token invalid");
        }

        // Map and return the safe DTO (hiding PasswordHash)
        return _mapper.Map<UserDto>(user);
    }
}
