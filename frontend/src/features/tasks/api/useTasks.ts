// features/tasks/api/useTasks.ts
// React Query hooks for task data.
// useQuery for reading tasks with filters.

import { useQuery } from "@tanstack/react-query";
import { getProjectTasks, type TaskFilters } from "./tasksApi";

// Hook to fetch tasks for a project with optional filters
export function useProjectTasksQuery(projectId: number, filters: TaskFilters = {}) {
    return useQuery({
        queryKey: ["tasks", projectId, filters],
        queryFn: () => getProjectTasks(projectId, filters),
        enabled: projectId > 0,
    });
}