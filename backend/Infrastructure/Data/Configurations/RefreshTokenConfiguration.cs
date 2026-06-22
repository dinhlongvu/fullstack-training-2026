// Infrastructure/Data/Configurations/RefreshTokenConfiguration.cs
// Database schema configuration for the RefreshToken entity

using Backend.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Backend.Infrastructure.Data.Configurations;

public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.HasKey(rt => rt.Id);

        builder.Property(rt => rt.TokenHash).IsRequired();
        builder.Property(rt => rt.ExpiresAt).IsRequired();
        builder.Property(rt => rt.CreatedAt).IsRequired();

        // Type Unique Index for TokenHash for quick lookup and anti-duplication
        builder.HasIndex(rt => rt.TokenHash).IsUnique();

        // 1 User can have multiple Refresh Tokens
        // If User is deleted, their refresh tokens are also deleted (Cascade)
        builder.HasOne(rt => rt.User)
            .WithMany()
            .HasForeignKey(rt => rt.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
