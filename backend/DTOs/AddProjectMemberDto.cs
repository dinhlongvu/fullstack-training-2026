// DTOs/AddProjectMemberDto.cs
// Request payload for adding a new member to a project

namespace Backend.DTOs;

/// <summary>
/// Request payload for adding a user to a project by email.
/// </summary>
public record AddProjectMemberDto
{
    /// <summary>The email address of the user to add as a project member.</summary>
    /// <example>teammate@gmail.com</example>
    public string Email { get; init; } = string.Empty;
}
