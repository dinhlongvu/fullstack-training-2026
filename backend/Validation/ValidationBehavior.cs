// ValidationBehavior.cs — MediatR pipeline behavior.
// Runs automatically BEFORE every handler. Validates the request.
// If validation fails → throws ValidationException → caught by ExceptionHandlingMiddleware.
// Handlers stay clean — no manual ValidateAsync() calls needed.

using FluentValidation;
using MediatR;

namespace Backend.Validation;

public class ValidationBehavior<TRequest, TResponse>
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private readonly IEnumerable<IValidator<TRequest>> _validators;

    public ValidationBehavior(IEnumerable<IValidator<TRequest>> validators)
    {
        _validators = validators;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        if (_validators.Any())
        {
            var context = new ValidationContext<TRequest>(request);
            var results = await Task.WhenAll(
                _validators.Select(v => v.ValidateAsync(context, cancellationToken)));
            var failures = results.SelectMany(r => r.Errors).ToList();

            if (failures.Any())
                throw new ValidationException(failures);
        }

        return await next(); // Validation passed → proceed to handler
    }
}
