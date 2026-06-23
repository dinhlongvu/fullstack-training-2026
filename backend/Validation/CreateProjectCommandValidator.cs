// Validation/CreateProjectCommandValidator.cs

using Backend.Commands.Projects;
using FluentValidation;

namespace Backend.Validation;

public class CreateProjectCommandValidator : AbstractValidator<CreateProjectCommand>
{
    public CreateProjectCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Project name is required.")
            .MaximumLength(200).WithMessage("Project name cannot exceed 200 characters.");

        RuleFor(x => x.Description)
            .MaximumLength(2000).WithMessage("Project description cannot exceed 2000 characters.");
    }
}
