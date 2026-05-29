// Middleware/ExceptionHandlingMiddleware.cs
// Catches ALL unhandled exceptions and returns consistent JSON error responses.
// Prevents leaking stack traces to the client in production.

using System.Net;
using System.Text.Json;
using FluentValidation;

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
        var (statusCode, message) = exception switch
        {
            ValidationException => (HttpStatusCode.BadRequest, exception.Message),
            UnauthorizedAccessException => (HttpStatusCode.Unauthorized, "Unauthorized."),
            KeyNotFoundException => (HttpStatusCode.NotFound, exception.Message),
            _ => (HttpStatusCode.InternalServerError, "An unexpected error occurred.")
        };

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        var response = new { error = message };
        await context.Response.WriteAsync(JsonSerializer.Serialize(response));
    }
}

// Extension method for clean registration in Program.cs:
// app.UseMiddleware<ExceptionHandlingMiddleware>();
