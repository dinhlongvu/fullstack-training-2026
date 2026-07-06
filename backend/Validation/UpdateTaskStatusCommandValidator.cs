// Validation/UpdateTaskStatusCommandValidator.cs

using Backend.Commands.Tasks;
using FluentValidation;

namespace Backend.Validation;

public class UpdateTaskStatusCommandValidator : AbstractValidator<UpdateTaskStatusCommand>
{
    public UpdateTaskStatusCommandValidator()
    {
        // IsInEnum() rejects any value not defined in the TaskStatus enum
        RuleFor(x => x.Status)
            .IsInEnum().WithMessage("Status must be 'Todo', 'InProgress', or 'Done'.");
    }
}
