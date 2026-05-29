# 15 — Validation & Object Mapping

Two small libraries that make your CQRS handlers clean and professional: **FluentValidation** checks incoming data, **AutoMapper** converts between Entity and DTO. Together they remove boilerplate from every handler.

> **Prerequisite:** [05 — ASP.NET Core + Carter](05-aspnet-core-carter.md) (CQRS handlers, DI). Both libraries are injected into MediatR handlers.

---

## 1. FluentValidation — "Is This Data Valid?"

Instead of writing `if (string.IsNullOrEmpty(title))` everywhere, define rules in a validator class:

```csharp
// Step 1: Install
// dotnet add package FluentValidation.AspNetCore

// Step 2: Create a validator
public class CreateTaskCommandValidator : AbstractValidator<CreateTaskCommand>
{
    public CreateTaskCommandValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required")
            .MaximumLength(200);

        RuleFor(x => x.Priority)
            .IsInEnum().WithMessage("Priority must be Low, Medium, or High");

        RuleFor(x => x.DueDate)
            .GreaterThan(DateTime.UtcNow)
            .When(x => x.DueDate.HasValue)
            .WithMessage("Due date must be in the future");
    }
}

// Step 3: Use in handler (manual validation)
public class CreateTaskHandler : IRequestHandler<CreateTaskCommand, TaskDto>
{
    private readonly CreateTaskCommandValidator _validator;

    public async Task<TaskDto> Handle(CreateTaskCommand cmd, CancellationToken ct)
    {
        var result = await _validator.ValidateAsync(cmd);
        if (!result.IsValid)
            throw new ValidationException(result.Errors);
        // ... proceed with business logic
    }
}
```

**Or even better — validate automatically with a pipeline behavior:**

```csharp
// ValidationBehavior.cs — runs BEFORE every handler
public class ValidationBehavior<TRequest, TResponse>
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private readonly IEnumerable<IValidator<TRequest>> _validators;

    public async Task<TResponse> Handle(TRequest request,
        RequestHandlerDelegate<TResponse> next, CancellationToken ct)
    {
        if (_validators.Any())
        {
            var context = new ValidationContext<TRequest>(request);
            var results = await Task.WhenAll(
                _validators.Select(v => v.ValidateAsync(context, ct)));
            var failures = results.SelectMany(r => r.Errors).ToList();
            if (failures.Any()) throw new ValidationException(failures);
        }
        return await next(); // Validation passed → proceed to handler
    }
}

// Register in Program.cs
builder.Services.AddValidatorsFromAssemblyContaining<CreateTaskCommandValidator>();
builder.Services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
```

Now every handler gets automatic validation — no manual `ValidateAsync()` calls needed!

---

## 2. AutoMapper — "Copy Data Between Objects"

Manual DTO mapping is tedious and error-prone:

```csharp
// ❌ Manual mapping — boring and easy to miss properties
var dto = new TaskDto
{
    Id = task.Id,
    Title = task.Title,
    Description = task.Description,
    Status = task.Status.ToString(),
    Priority = task.Priority.ToString(),
    AssigneeName = task.Assignee?.FullName,
    CommentCount = task.Comments.Count,
};
```

AutoMapper does this automatically:

```csharp
// Step 1: Install
// dotnet add package AutoMapper

// Step 2: Define mapping profile
public class TaskMappingProfile : Profile
{
    public TaskMappingProfile()
    {
        CreateMap<TaskItem, TaskDto>()
            .ForMember(d => d.Status, o => o.MapFrom(s => s.Status.ToString()))
            .ForMember(d => d.Priority, o => o.MapFrom(s => s.Priority.ToString()))
            .ForMember(d => d.AssigneeName, o => o.MapFrom(s => s.Assignee!.FullName))
            .ForMember(d => d.CommentCount, o => o.MapFrom(s => s.Comments.Count));

        CreateMap<CreateTaskCommand, TaskItem>()
            .ForMember(d => d.CreatedAt, o => o.MapFrom(_ => DateTime.UtcNow));
    }
}

// Step 3: Register in Program.cs
builder.Services.AddAutoMapper(typeof(TaskMappingProfile).Assembly);

// Step 4: Use in handler — one line!
public class GetTaskHandler : IRequestHandler<GetTaskQuery, TaskDto>
{
    private readonly IMapper _mapper;

    public async Task<TaskDto> Handle(GetTaskQuery request, CancellationToken ct)
    {
        var task = await _db.Tasks
            .Include(t => t.Assignee)
            .Include(t => t.Comments)
            .FirstOrDefaultAsync(t => t.Id == request.Id);

        return _mapper.Map<TaskDto>(task); // ← That's it!
    }
}
```

**Even better — project directly in the database query:**

```csharp
// AutoMapper can translate to SQL — no Include needed!
var dto = await _db.Tasks
    .Where(t => t.Id == request.Id)
    .ProjectTo<TaskDto>(_mapper.ConfigurationProvider)
    .FirstOrDefaultAsync();
// EF Core only SELECTs the columns TaskDto needs — faster!
```

---

## 3. How They Fit in a CQRS Handler

```csharp
public class CreateTaskHandler : IRequestHandler<CreateTaskCommand, TaskDto>
{
    private readonly AppDbContext _db;
    private readonly IMapper _mapper;
    // Validator runs automatically via ValidationBehavior (no manual injection)
    // ^ FluentValidation ^          ^ AutoMapper ^

    public async Task<TaskDto> Handle(CreateTaskCommand cmd, CancellationToken ct)
    {
        // 1. Validation — automatic via pipeline behavior
        // 2. Map → Entity
        var task = _mapper.Map<TaskItem>(cmd);
        // 3. Save
        _db.Tasks.Add(task);
        await _db.SaveChangesAsync();
        // 4. Map → DTO
        return _mapper.Map<TaskDto>(task);
    }
}
```

Clean, focused, testable.

---

## Key Rules

| Rule | Why |
|------|-----|
| One validator per command/query | Matches CQRS: each handler has its own validation rules |
| Use pipeline behavior for validation | Don't call `ValidateAsync()` in every handler — automate it |
| `.ProjectTo<T>()` over `.Include()` + `.Map()` | Translates to SQL `SELECT` — only fetches columns you need |
| Don't over-map simple properties | If AutoMapper config is longer than manual mapping, skip it |

---

## 📚 Further Reading

- [FluentValidation Docs](https://docs.fluentvalidation.net)
- [AutoMapper Docs](https://docs.automapper.org)
- [MediatR Pipeline Behaviors](https://github.com/jbogard/MediatR/wiki/Behaviors)
- [AutoMapper ProjectTo with EF Core](https://docs.automapper.org/en/stable/Queryable-Extensions.html)

---

> **Tip:** Think of FluentValidation as the bouncer at the club — checks your ID before you enter. AutoMapper is the coat check — you hand in one thing, get back another, no manual labor. Together they keep your handlers focused on business logic, not plumbing.
