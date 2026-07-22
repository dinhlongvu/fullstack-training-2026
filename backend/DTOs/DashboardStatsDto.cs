// DTOs/DashboardStatsDto.cs

namespace Backend.DTOs;

public record TaskStatsByStatusDto(
    int Todo,
    int InProgress,
    int Done
);

public record UpcomingDeadlineDto(
    int TaskId,
    string Title,
    DateTime DueDate,
    int ProjectId,
    Backend.Domain.Priority Priority
);

public record DashboardStatsDto(
    TaskStatsByStatusDto TasksByStatus,
    List<UpcomingDeadlineDto> UpcomingDeadlines,
    int TotalAssigned,
    int OverdueCount
);
