// Validation/CreateCommentCommandValidator.cs

using Backend.Commands.Tasks;
using FluentValidation;

namespace Backend.Validation;

public class CreateCommentCommandValidator : AbstractValidator<CreateCommentCommand>
{
    public CreateCommentCommandValidator()
    {
        RuleFor(x => x.Content)
            .NotEmpty().WithMessage("Comment content cannot be empty.")
            .MaximumLength(2000).WithMessage("Comment content cannot exceed 2000 characters.");
    }
}
