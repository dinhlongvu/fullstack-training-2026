// Exceptions/UnauthorizedException.cs
// Custom exception to trigger a 401 Unauthorized HTTP response
// Thrown when email/password verification fails

namespace Backend.Exceptions;

public class UnauthorizedException : Exception
{
    // Pass the error message to C#'s Exception base class
    public UnauthorizedException(string message) : base(message)
    {
    }
}
