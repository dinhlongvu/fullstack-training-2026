// Mapping/TaskMappingProfile.cs
// AutoMapper profile — defines how Entity ↔ DTO conversions work.
// One profile per domain group. Registered globally in Program.cs.

using AutoMapper;
using Backend.Commands.Tasks;
using Backend.Domain;
using Backend.DTOs;

namespace Backend.Mapping;

public class TaskMappingProfile : Profile
{
    public TaskMappingProfile()
    {
        // Entity → DTO (full detail)
        CreateMap<TaskItem, TaskDto>()
            .ForMember(d => d.Status, o => o.MapFrom(s => s.Status.ToString()))
            .ForMember(d => d.Priority, o => o.MapFrom(s => s.Priority.ToString()))
            .ForMember(d => d.AssigneeName, o => o.MapFrom(s => s.Assignee!.FullName))
            .ForMember(d => d.CommentCount, o => o.MapFrom(s => s.Comments.Count));

        // Entity → Summary DTO (list view — fewer fields)
        CreateMap<TaskItem, TaskSummaryDto>()
            .ForMember(d => d.Status, o => o.MapFrom(s => s.Status.ToString()))
            .ForMember(d => d.Priority, o => o.MapFrom(s => s.Priority.ToString()))
            .ForMember(d => d.AssigneeName, o => o.MapFrom(s => s.Assignee!.FullName));

        // Command → Entity
        CreateMap<CreateTaskCommand, TaskItem>()
            .ForMember(d => d.CreatedAt, o => o.MapFrom(_ => DateTime.UtcNow))
            .ForMember(d => d.Status, o => o.MapFrom(_ => TaskStatus.Todo));
    }
}
