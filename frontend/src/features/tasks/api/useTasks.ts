// features/tasks/api/useTasks.ts
// React Query hooks for task data.
// useQuery for reading, useMutation for creating.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getProjectTasks,
  createTask,
  updateTaskStatus,
  type TaskFilters,
  type CreateTaskRequest,
  type TaskStatus,
} from "./tasksApi";

// Hook to fetch tasks for a project with optional filters
export function useProjectTasksQuery(
  projectId: number,
  filters: TaskFilters = {},
) {
  return useQuery({
    queryKey: ["tasks", projectId, filters],
    queryFn: () => getProjectTasks(projectId, filters),
    enabled: projectId > 0,
  });
}

// Hook to create a new task in a project
export function useCreateTaskMutation(projectId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateTaskRequest) => createTask(projectId, request),
    onSuccess: () => {
      // Invalidate ALL task queries for this project (regardless of filters)
      // so every filter view gets fresh data
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
  });
}

// Hook to move a task to a new status (Kanban column toggle)
export function useUpdateTaskStatusMutation(projectId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, status }: { taskId: number; status: TaskStatus }) =>
      updateTaskStatus(taskId, status),
    onSuccess: () => {
      // Same invalidation pattern as create — refresh every filter view
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
  });
}
