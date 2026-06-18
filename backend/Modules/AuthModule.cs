// Modules/AuthModule.cs
// Carter module for authentication endpoints.
// Keeps HTTP concerns thin and delegates business logic to MediatR.

using Backend.Commands.Auth;
using Backend.DTOs; // Add this using to identify UserDto
using Carter;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;

namespace Backend.Modules;

public class AuthModule : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        // Initialize a common API group for all system authentication flows
        var group = app.MapGroup("/api/auth");

        // POST /api/auth/register
        // Handles new user account registration
        group.MapPost("/register", async (
            RegisterUserCommand command,
            IMediator mediator) =>
        {
            // Send Command to MediatR to handle password hashing and DB storage
            var userDto = await mediator.Send(command);
            // Return HTTP 201 Created with new resource location and UserDto data
            return Results.Created($"/api/users/{userDto.Id}", userDto);
        })
        .Produces<UserDto>(StatusCodes.Status201Created)
        .Produces(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status409Conflict);

        // POST /api/auth/login
        // Authenticates a user and returns a JWT token
        group.MapPost("/login", async (
            LoginCommand command,
            IMediator mediator) =>
        {
            // Pass data to Handler to check login information and Token signature
            var response = await mediator.Send(command);
            // Returns HTTP 200 OK with Token and User's safety information
            return Results.Ok(response);
        })
        .Produces<LoginResponseDto>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status401Unauthorized);
    }
}
