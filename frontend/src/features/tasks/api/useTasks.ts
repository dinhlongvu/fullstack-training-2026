// features/tasks/api/useTasks.ts
// React Query hooks for task data.
// useQuery for reading, useMutation for creating.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getProjectTasks,
  getTask,
  getTaskComments,
  createTask,
  updateTaskStatus,
  assignTask,
  deleteTask,
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

// Hook to assign or unassign a task to a project member
export function useAssignTaskMutation(projectId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      assigneeId,
    }: {
      taskId: number;
      assigneeId: number | null;
    }) => assignTask(taskId, assigneeId),
    onSuccess: () => {
      // Same invalidation pattern — refresh every filter view so the card's
      // assignee updates without a manual refresh
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
  });
}

// Hook to delete a task
export function useDeleteTaskMutation(projectId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: number) => deleteTask(taskId),
    onSuccess: () => {
      // Same invalidation pattern — refresh every filter view so the card disappears
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
  });
}

// Hook to fetch a single task's detail
export function useTaskQuery(taskId: number) {
  return useQuery({
    queryKey: ["task", taskId],
    queryFn: () => getTask(taskId),
    enabled: taskId > 0,
  });
}

// Hook to fetch the comment list for a task
export function useTaskCommentsQuery(taskId: number) {
  return useQuery({
    queryKey: ["comments", taskId],
    queryFn: () => getTaskComments(taskId),
    enabled: taskId > 0,
  });
}
