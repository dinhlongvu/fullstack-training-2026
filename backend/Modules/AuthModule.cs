// Modules/AuthModule.cs
// Carter module for authentication endpoints.
// Keeps HTTP concerns thin and delegates business logic to MediatR.

using Backend.Commands.Auth;
using Backend.DTOs;
using Backend.Queries.Auth;
using Backend.Services.Auth;
using Carter;
using MediatR;

namespace Backend.Modules;

public class AuthModule : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        // Initialize a common API group for all system authentication flows and tag it for Swagger
        var group = app.MapGroup("/api/auth").WithTags("Auth");

        // POST /api/auth/register
        group.MapPost("/register", async (
            RegisterUserCommand command,
            IMediator mediator) =>
        {
            var userDto = await mediator.Send(command);
            return Results.Created($"/api/users/{userDto.Id}", userDto);
        })
        .WithName("RegisterUser")
        .WithSummary("Register a new user account")
        .WithDescription("Creates a new user account and returns the created user details.")
        .Produces<UserDto>(StatusCodes.Status201Created)
        .Produces(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status409Conflict);

        // POST /api/auth/login
        group.MapPost("/login", async (
            LoginCommand command,
            IMediator mediator) =>
        {
            var response = await mediator.Send(command);
            return Results.Ok(response);
        })
        .WithName("LoginUser")
        .WithSummary("User login")
        .WithDescription("Authenticates a user and returns a JWT Bearer token along with user info.")
        .Produces<LoginResponseDto>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status401Unauthorized);

        // GET /api/auth/me
        group.MapGet("/me", async (HttpContext context, IMediator mediator, CancellationToken ct) =>
        {
            var userId = context.User.GetUserId();
            var query = new GetCurrentUserQuery(userId);
            var userProfile = await mediator.Send(query, ct);
            return Results.Ok(userProfile);
        })
        .RequireAuthorization()
        .WithName("GetCurrentUser")
        .WithSummary("Get current user profile")
        .WithDescription("Retrieves the profile information of the currently authenticated user based on the JWT token.")
        .Produces<UserDto>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized);

        // POST /api/auth/refresh
        group.MapPost("/refresh", async (IMediator mediator, RefreshTokenCommand command) =>
        {
            var result = await mediator.Send(command);
            return Results.Ok(result);
        })
        .WithName("RefreshToken")
        .WithSummary("Refresh access token")
        .WithDescription("Exchanges a valid, non-expired refresh token for a new set of JWT access and refresh tokens.")
        .Produces<RefreshTokenResponseDto>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces<ValidationErrorResponse>(StatusCodes.Status400BadRequest)
        .AllowAnonymous(); // refresh must be reachable without an access token
    }
}
