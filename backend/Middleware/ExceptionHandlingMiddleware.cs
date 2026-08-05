// Middleware/ExceptionHandlingMiddleware.cs
// Catches ALL unhandled exceptions and returns consistent JSON error responses.
// Prevents leaking stack traces to the client in production.

using System.Net;
using System.Text.Json;
using Backend.DTOs;
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

            // Framework can emit 404 (no route match), 405 (wrong method), or 415 (wrong Content-Type)
            // without throwing an exception, so these statuses bypass the catch blocks below.
            // Backfill the error envelope for any error response that has not yet written a body.
            if (context.Response.StatusCode >= 400 && !context.Response.HasStarted)
            {
                var traceId = context.GetTraceId();
                context.Response.ContentType = "application/json";

                var message = context.Response.StatusCode switch
                {
                    StatusCodes.Status404NotFound => "Resource not found.",
                    StatusCodes.Status405MethodNotAllowed => "HTTP method not allowed for this route.",
                    StatusCodes.Status415UnsupportedMediaType => "Content-Type must be application/json.",
                    _ => "The request could not be processed."
                };

                var fallbackResponse = new ErrorResponse { Error = message, TraceId = traceId };
                await context.Response.WriteAsync(JsonSerializer.Serialize(fallbackResponse, _jsonOptions));
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
            // 400 - validation failures return an array of message
            ValidationException ve => new ValidationErrorResponse
            {
                Errors = ve.Errors.Select(e => e.ErrorMessage),
                TraceId = traceId
            },

            // 400 - malformed body: return a safe generic message, never echo internal .NER paths
            BadHttpRequestException bad when bad.StatusCode == StatusCodes.Status400BadRequest => new ValidationErrorResponse()
            {
                Errors = new[] { "The request body or a query parameter is malformed or has an invalid value." },
                TraceId = traceId
            },

            // Other BadHttpRequestException status codes (e.g 411, 413)
            BadHttpRequestException => new ErrorResponse { Error = "The request could not be processed.", TraceId = traceId },

            ConflictException ce => new ErrorResponse { Error = ce.Message, TraceId = traceId },
            UnauthorizedException ue => new ErrorResponse { Error = ue.Message, TraceId = traceId },
            UnauthorizedAccessException => new ErrorResponse { Error = "Unauthorized.", TraceId = traceId },
            KeyNotFoundException ke => new ErrorResponse { Error = ke.Message, TraceId = traceId },
            _ => new ErrorResponse { Error = "Internal server error.", TraceId = traceId }
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(response, _jsonOptions));
    }
}

// Extension method for clean registration in Program.cs:
// app.UseMiddleware<ExceptionHandlingMiddleware>();
