//backend/Middleware/TraceIdExtensions.cs

using System.Diagnostics;

namespace Backend.Middleware;

public static class TraceIdExtensions
{
    /// <summary>Correlation id khớp với log: ưu tiên W3C trace id, fallback về connection id.</summary>
    public static string GetTraceId(this HttpContext context)
        => Activity.Current?.Id ?? context.TraceIdentifier;
}
