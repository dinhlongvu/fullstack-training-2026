// Domain/RefreshToken.cs
using System;

namespace Backend.Domain;

public class RefreshToken
{
    public int Id { get; set; }

    public int UserId { get; set; }

    // Store hashed token (e.g. SHA-256), NEVER the plain text token
    public string TokenHash { get; set; } = string.Empty;

    public DateTime ExpiresAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Null means the token is still active. If set, it means it was used or revoked.
    public DateTime? RevokedAt { get; set; }

    // Navigation property to link with the User table
    public User User { get; set; } = null!;

    // Helper property to quickly check if this token is valid for use
    public bool IsActive => RevokedAt == null && DateTime.UtcNow <= ExpiresAt;
}
