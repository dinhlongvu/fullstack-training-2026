// Middleware/ExceptionHandlingMiddleware.cs
// Catches ALL unhandled exceptions and returns consistent JSON error responses.
// Prevents leaking stack traces to the client in production.

using System.Net;
using System.Text.Json;
using Backend.Exceptions;
using FluentValidation;

namespace Backend.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    private static readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

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

            // Handle 404 from ASP.NET Core routing (route not found, not a business-logic 404).
            // Business-logic 404s are thrown as KeyNotFoundException and caught below.
            if (context.Response.StatusCode == StatusCodes.Status404NotFound && !context.Response.HasStarted)
            {
                var traceId = context.GetTraceId();
                context.Response.ContentType = "application/json";
                var notFoundResponse = new { error = "Resource not found", traceId };
                await context.Response.WriteAsync(JsonSerializer.Serialize(notFoundResponse, _jsonOptions));
            }
        }
        catch (BadHttpRequestException ex)
        {
            // Client-side error: malformed JSON body, wrong data type, missing required body.
            // Log as Warning (not Error) because this is the client's fault, not the server's.
            _logger.LogWarning(ex, "Malformed request for {Method} {Path}",
                context.Request.Method, context.Request.Path);

            if (context.Response.HasStarted)
            {
                context.Abort();
                return;
            }

            await HandleExceptionAsync(context, ex);
        }
        catch (Exception ex)
        {
            // Unexpected server-side error — log as Error for investigation.
            _logger.LogError(ex, "Unhandled exception for {Method} {Path}",
                context.Request.Method, context.Request.Path);

            if (context.Response.HasStarted)
            {
                _logger.LogWarning("Response has already started. Skipping global error formatting.");
                context.Abort();
                return;
            }

            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        // Map each exception type to the appropriate HTTP status code.
        var statusCode = exception switch
        {
            ValidationException => HttpStatusCode.BadRequest,
            // Use the status code embedded in the exception (usually 400).
            BadHttpRequestException bad => (HttpStatusCode)bad.StatusCode,
            ConflictException => HttpStatusCode.Conflict,
            UnauthorizedException => HttpStatusCode.Unauthorized,
            UnauthorizedAccessException => HttpStatusCode.Unauthorized,
            KeyNotFoundException => HttpStatusCode.NotFound,
            _ => HttpStatusCode.InternalServerError
        };

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        var traceId = context.GetTraceId();

        // Build the response body.
        // Convention: 400 → { "errors": [...], "traceId": "..." }
        //             all other errors → { "error": "...", "traceId": "..." }
        object response = exception switch
        {
            ValidationException ve => new
            {
                errors = ve.Errors.Select(e => e.ErrorMessage),
                traceId
            },

            // Do NOT echo bad.Message — it can leak internal .NET type names and JSON paths.
            // Return a safe, generic message instead.
            BadHttpRequestException bad when bad.StatusCode == StatusCodes.Status400BadRequest => new
            {
                errors = new[] { "The request body or a query parameter is malformed or has an invalid value." },
                traceId
            },
            BadHttpRequestException => new { error = "The request could not be processed.", traceId },

            ConflictException ce => new { error = ce.Message, traceId },
            UnauthorizedException ue => new { error = ue.Message, traceId },
            UnauthorizedAccessException => new { error = "Unauthorized.", traceId },
            KeyNotFoundException ke => new { error = ke.Message, traceId },
            _ => new { error = "Internal server error", traceId }
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(response, _jsonOptions));
    }
}

// Extension method for clean registration in Program.cs:
// app.UseMiddleware<ExceptionHandlingMiddleware>();
