// backend/Modules/ErrorResults.cs

using Backend.DTOs;
using Backend.Middleware;

namespace Backend.Modules;

/// <summary>
/// Factory methods for standard error responses.
/// Centralizes error envelope construction so call sites cannot forget traceId.
/// </summary>
public static class ErrorResults
{
    /// <summary>Returns HTTP 404 with the standard error envelope.</summary>
    public static IResult NotFound(HttpContext context, string message)
        => Results.NotFound(new ErrorResponse { Error = message, TraceId = context.GetTraceId() });

    /// <summary>Returns HTTP 409 with the standard error envelope.</summary>
    public static IResult Conflict(HttpContext context, string message)
        => Results.Conflict(new ErrorResponse { Error = message, TraceId = context.GetTraceId() });
}
