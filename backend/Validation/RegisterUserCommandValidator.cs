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
        // Validate email is not empty and is a valid email fomat
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required")
            .EmailAddress().WithMessage("Email format is invalid");

        // Full name validation
        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Full name is required.")
            .MaximumLength(200).WithMessage("Full name must be less than 200 characters");

        // Password validation: at least 8 characters
        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required")
            .MinimumLength(8).WithMessage("Password must be at least 8 characters");
    }
}
