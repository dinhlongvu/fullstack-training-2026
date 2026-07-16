// Middleware/ExceptionHandlingMiddleware.cs
// Catches ALL unhandled exceptions and returns consistent JSON error responses.
// Prevents leaking stack traces to the client in production.

using System.Diagnostics;
using System.Net;
using System.Text.Json;
using Backend.Exceptions; // Custom exceptions can be defined here for more specific error handling.
using FluentValidation;
using Microsoft.AspNetCore.Http.Json;

namespace Backend.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);

            // Getting 404 error from ASP.NET Core when calling Endpoint/URL does not exist (Route not found)
            if (context.Response.StatusCode == StatusCodes.Status404NotFound && !context.Response.HasStarted)
            {
                var traceId = Activity.Current?.Id ?? context.TraceIdentifier;
                context.Response.ContentType = "application/json";
                var response = new
                {
                    error = "Resource not found",
                    traceId
                };
                await context.Response.WriteAsync(JsonSerializer.Serialize(response));
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception for {Method} {Path}", context.Request.Method, context.Request.Path);

            if (context.Response.HasStarted)
            {
                // Log warnings and disconnect safely
                _logger.LogWarning("Response has already started. Skipping global error formatting");
                context.Abort();
                return;
            }
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
            UnauthorizedException => HttpStatusCode.Unauthorized, // Map login errors to 401
            UnauthorizedAccessException => HttpStatusCode.Unauthorized,
            KeyNotFoundException => HttpStatusCode.NotFound,
            _ => HttpStatusCode.InternalServerError
        };

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        // Get traceId from the system
        var traceId = Activity.Current?.Id ?? context.TraceIdentifier;

        // 2. Format Body returns (Validation returns array 'errors', otherwise returns 'error')
        object response = exception switch
        {
            ValidationException ve => new
            {
                errors = "Validation failed",
                traceId,
                details = ve.Errors.Select(e => new { e.PropertyName, e.ErrorMessage })
            },
            ConflictException ce => new { error = ce.Message, traceId },
            UnauthorizedException ue => new { error = ue.Message, traceId }, // Returns the error message from the LoginCommand handler
            UnauthorizedAccessException => new { error = "Unauthorized.", traceId },
            KeyNotFoundException ke => new { error = ke.Message, traceId },

            // Error 500 (Unexpected errors)
            _ => new { error = "Internal server error", traceId }
        };
        var jsonOptions = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        await context.Response.WriteAsync(JsonSerializer.Serialize(response, jsonOptions));
    }
}

// Extension method for clean registration in Program.cs:
// app.UseMiddleware<ExceptionHandlingMiddleware>();
