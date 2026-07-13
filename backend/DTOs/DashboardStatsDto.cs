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
    int ProjectId
);

public record DashboardStatsDto(
    TaskStatsByStatusDto TasksByStatus,
    List<UpcomingDeadlineDto> UpcomingDeadlines,
    int TotalAssigned
);
