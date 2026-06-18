// Validation/LoginCommandValidator.cs
// FluentValidation rules for the login command
// Ensures valid email formatting and presence of required fields before processing

using Backend.Commands.Auth;
using FluentValidation;

namespace Backend.Validation;

public class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        // Check Email format
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required")
            .EmailAddress().WithMessage("Invalid email format");

        // Check Password presence
        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required");
    }
}
