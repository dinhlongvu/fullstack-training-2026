// Validation/CreateTaskCommandValidator.cs
// FluentValidation — runs BEFORE the handler (via MediatR pipeline behavior).
// One validator per command/query. Keeps validation logic OUT of handlers.

using Backend.Commands.Tasks;
using FluentValidation;

namespace Backend.Validation;

public class CreateTaskCommandValidator : AbstractValidator<CreateTaskCommand>
{
    public CreateTaskCommandValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required.")
            .MaximumLength(200).WithMessage("Title must be 200 characters or less.");

        RuleFor(x => x.Description)
            .MaximumLength(2000).WithMessage("Description is too long.");

        RuleFor(x => x.Priority)
            .IsInEnum().WithMessage("Priority must be Low, Medium, or High.");

        RuleFor(x => x.DueDate)
            .Must(d => d!.Value.Date >= DateTime.UtcNow.Date)
            .When(x => x.DueDate.HasValue)
            .WithMessage("Due date must be today or in the future.");
    }
}
