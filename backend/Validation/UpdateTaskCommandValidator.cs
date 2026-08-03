// Validation/UpdateTaskCommandValidator.cs

using Backend.Commands.Tasks;
using FluentValidation;

namespace Backend.Validation;

public class UpdateTaskCommandValidator : AbstractValidator<UpdateTaskCommand>
{
    public UpdateTaskCommandValidator()
    {
        // Each block only runs when the caller explicitly provides the field.

        When(x => x.Title != null, () =>
        {
            RuleFor(x => x.Title)
                .NotEmpty().WithMessage("Title cannot be empty if provided.")
                .MaximumLength(200).WithMessage("Title must be 200 characters or less.");
        });

        When(x => x.Description != null, () =>
        {
            RuleFor(x => x.Description)
                .MaximumLength(2000).WithMessage("Description must be 2000 characters or less.");
        });

        When(x => x.DueDate.HasValue, () =>
        {
            // Use Must() with a lambda so DateTime.UtcNow is evaluated at request time,
            RuleFor(x => x.DueDate!.Value)
                .Must(d => d.Date >= DateTime.UtcNow.Date)
                .WithMessage("Due date must be today or in the future.");
        });
    }
}
