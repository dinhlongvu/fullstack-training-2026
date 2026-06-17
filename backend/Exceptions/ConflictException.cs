// Exceptions/ConflictException.cs
// Use this when the requested operation cannot be completed
// because it would create duplicate or conflicting data

namespace Backend.Exceptions;

public class ConflictException : Exception
{
    public ConflictException(string message) : base(message)
    {
    }
}
