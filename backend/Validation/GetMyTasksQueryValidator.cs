// Validation/GetMyTasksQueryValidator.cs

using Backend.Queries.Dashboard;
using FluentValidation;

namespace Backend.Validation;

public class GetMyTasksQueryValidator : AbstractValidator<GetMyTasksQuery>
{
    public GetMyTasksQueryValidator()
    {
        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(1)
            .WithMessage("Page must be greater than or equal to 1.");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 100)
            .WithMessage("PageSize must be between 1 and 100.");
    }
}
