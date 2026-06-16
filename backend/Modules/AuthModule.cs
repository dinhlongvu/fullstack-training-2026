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
        var group = app.MapGroup("/api/auth");

        group.MapPost("/register", async (
            RegisterUserCommand command,
            IMediator mediator) =>
        {
            var userDto = await mediator.Send(command);
            return Results.Created($"/api/users/{userDto.Id}", userDto);
        })
        .Produces<UserDto>(StatusCodes.Status201Created)
        .Produces(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status409Conflict);
    }
}
