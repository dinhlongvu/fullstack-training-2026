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

        RuleFor(x => x.TargetUserId)
            .GreaterThan(0).WithMessage("TargetUserId must be greater than 0.");
    }
}
