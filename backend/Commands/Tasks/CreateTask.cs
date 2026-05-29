// Commands/Tasks/CreateTask.cs
// CQRS Command: ONE file = Command record + Handler (+ Validator reference).
// Each operation gets its own file. Clean, testable, single-responsibility.

using Backend.Domain;
using Backend.DTOs;
using Backend.Infrastructure.Data;
using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Backend.Commands.Tasks;

// 1. Command = the "request" DTO (immutable record)
public record CreateTaskCommand(
    int ProjectId,
    string Title,
    string Description,
    Priority Priority,
    DateTime? DueDate
) : IRequest<TaskDto>;

// 2. Handler = the business logic
public class CreateTaskHandler : IRequestHandler<CreateTaskCommand, TaskDto>
{
    private readonly AppDbContext _db;
    private readonly IMapper _mapper;

    public CreateTaskHandler(AppDbContext db, IMapper mapper)
    {
        _db = db;
        _mapper = mapper;
    }

    public async Task<TaskDto> Handle(CreateTaskCommand cmd, CancellationToken ct)
    {
        // Validation runs automatically via MediatR pipeline behavior.
        // No manual ValidateAsync() needed — see Validation/CreateTaskCommandValidator.cs

        // Map Command → Entity
        var task = _mapper.Map<TaskItem>(cmd);

        _db.Tasks.Add(task);
        await _db.SaveChangesAsync(ct);

        // Map Entity → DTO
        return _mapper.Map<TaskDto>(task);
    }
}
