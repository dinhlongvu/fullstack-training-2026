// backend/DTOs/ValidationErrorResponse.cs

namespace Backend.DTOs;

/// <summary>
/// Standard validation error envelope returned by the exception handling middleware.
/// </summary>
public record ValidationErrorResponse
{
    /// <summary>One message per failed validation rule.</summary>
    /// <example>["Priority must be Low, Medium, or High."]</example>
    public IEnumerable<string> Errors { get; init; } = Array.Empty<string>();

    /// <summary>Correlation id, useful when reporting an issue.</summary>
    /// <example>00-1a2b3c4d5e6f-0011223344556677-00</example>
    public string TraceId { get; init; } = string.Empty;
}
