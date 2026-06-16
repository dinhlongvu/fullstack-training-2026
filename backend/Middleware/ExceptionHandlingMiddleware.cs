// Middleware/ExceptionHandlingMiddleware.cs
// Catches ALL unhandled exceptions and returns consistent JSON error responses.
// Prevents leaking stack traces to the client in production.

using System.Net;
using System.Text.Json;
using FluentValidation;
using Backend.Exceptions; // Custom exceptions can be defined here for more specific error handling.

namespace Backend.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;

    public ExceptionHandlingMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        // 1. Determine HTTP Status Code
        var statusCode = exception switch
        {
            ValidationException => HttpStatusCode.BadRequest,
            ConflictException => HttpStatusCode.Conflict,
            UnauthorizedAccessException => HttpStatusCode.Unauthorized,
            KeyNotFoundException => HttpStatusCode.NotFound,
            _ => HttpStatusCode.InternalServerError
        };

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        // 2. Format Body returns (Validation returns array 'errors', otherwise returns 'error')
        object response = exception switch
        {
            ValidationException ve => new { errors = ve.Errors.Select(e => e.ErrorMessage) },
            ConflictException ce => new { error = ce.Message },
            UnauthorizedAccessException => new { error = "Unauthorized." },
            KeyNotFoundException ke => new { error = ke.Message },
            _ => new { error = "An unexpected error occurred." } // Does not return specific errors, avoiding data disclosure
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(response));
    }
}

// Extension method for clean registration in Program.cs:
// app.UseMiddleware<ExceptionHandlingMiddleware>();
