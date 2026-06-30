// Validation/AddProjectMemberCommandValidator.cs
// Validates the AddProjectMemberCommand parameters.

using Backend.Commands.Projects;
using FluentValidation;

namespace Backend.Validation;

public class AddProjectMemberCommandValidator : AbstractValidator<AddProjectMemberCommand>
{
    public AddProjectMemberCommandValidator()
    {
        RuleFor(x => x.ProjectId)
            .GreaterThan(0).WithMessage("ProjectId must be greater than 0.");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("Email must be a valid email address.");
    }
}
