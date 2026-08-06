// backend/DTOs/ErrorResponse.cs

namespace Backend.DTOs;

/// <summary>
/// Standard error envelope returned for all non-validation error responses (401, 403, 404, 409, 500).
/// Shape: { "error": "...", "traceId": "..." }
/// </summary>
public record ErrorResponse
{
    /// <summary>Human-readable description of what went wrong.</summary>
    /// <example>Task not found</example>
    public string Error { get; init; } = string.Empty;

    /// <summary>Correlation id — use this when reporting an issue to support.</summary>
    /// <example>00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01</example>
    public string TraceId { get; init; } = string.Empty;
}
