// Validation/UpdateProjectCommandValidator.cs

using Backend.Commands.Projects;
using FluentValidation;

namespace Backend.Validation;

public class UpdateProjectCommandValidator : AbstractValidator<UpdateProjectCommand>
{
    public UpdateProjectCommandValidator()
    {
        // 1. Rule for Name: Required and no more than 200 characters (Sync with EF Core)
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Project name is required.")
            .MaximumLength(200).WithMessage("Project name must not exceed 200 characters.");

        // 2. Rule for Description: Optional, but if provided, must not exceed 2000 characters
        RuleFor(x => x.Description)
            .MaximumLength(2000).WithMessage("Description must not exceed 2000 characters.");
    }
}
