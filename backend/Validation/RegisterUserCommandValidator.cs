// Validation/RegisterUserCommandValidator.cs
// FluentValidation validator for RegisterUserCommand
// Runs automatically before handler via Mediator pipeline

using Backend.Commands.Auth;
using FluentValidation;

namespace Backend.Validation;

public class RegisterUserCommandValidator : AbstractValidator<RegisterUserCommand>
{
    public RegisterUserCommandValidator()
    {
        // Email validation: not empty, max 254 chars, valid format, and custom regex for robustness
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required")
            .MaximumLength(254).WithMessage("Email must be less than 254 characters")
            .EmailAddress().WithMessage("Email format is invalid")
            .Matches(@"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$").WithMessage("Email format is invalid");

        // Full name validation
        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Full name is required.")
            .MaximumLength(200).WithMessage("Full name must be less than 200 characters");

        // Password validation: minimum 8 and maximum 100 characters to prevent DoS vector
        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required")
            .MinimumLength(8).WithMessage("Password must be at least 8 characters")
            .MaximumLength(100).WithMessage("Password must be less than 100 characters");
    }
}
