// features/tasks/api/useTasks.ts
// React Query hooks for task data.
// useQuery for reading, useMutation for creating.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getProjectTasks,
  getTask,
  getTaskComments,
  createTask,
  createComment,
  updateTaskStatus,
  assignTask,
  deleteTask,
  type Task,
  type TaskFilters,
  type CreateTaskRequest,
  type CreateCommentRequest,
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

// Hook to move a task to a new status (Kanban column toggle).
// Uses an OPTIMISTIC UPDATE: the card jumps to the new column immediately,
// the PATCH runs in the background, and we roll back if it fails.
export function useUpdateTaskStatusMutation(projectId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, status }: { taskId: number; status: TaskStatus }) =>
      updateTaskStatus(taskId, status),

    // 1. onMutate — runs BEFORE the request. Update the cache right away so the
    //    card moves without waiting for the server.
    onMutate: async ({ taskId, status }) => {
      // Cancel in-flight board refetches so a late response can't overwrite our
      // optimistic change with stale data.
      await queryClient.cancelQueries({ queryKey: ["tasks", projectId] });

      // Snapshot every cached board view (all filter combinations) for rollback.
      const previousTasks = queryClient.getQueriesData<Task[]>({
        queryKey: ["tasks", projectId],
      });

      // Write the new status into every cached board view.
      queryClient.setQueriesData<Task[]>(
        { queryKey: ["tasks", projectId] },
        (old) =>
          old?.map((task) => (task.id === taskId ? { ...task, status } : task)),
      );

      // Pass the snapshot to onError via the mutation context.
      return { previousTasks };
    },

    // 2. onError — restore the snapshot and tell the user.
    onError: (error, _variables, context) => {
      context?.previousTasks.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      toast.error(error.message);
    },

    // 3. onSettled — success or failure, refetch to guarantee the cache matches
    //    the server (source of truth).
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      queryClient.invalidateQueries({ queryKey: ["task", variables.taskId] });
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
    onSuccess: (_data, variables) => {
      // Refresh every board filter view so the card's assignee updates
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      // Also refresh the Task Detail cache for this task, otherwise opening
      // the detail after an assign/unassign shows stale data
      queryClient.invalidateQueries({ queryKey: ["task", variables.taskId] });
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

// Hook to add a comment to a task
export function useCreateCommentMutation(taskId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateCommentRequest) =>
      createComment(taskId, request),
    onSuccess: () => {
      // Refresh the comment list so the new comment appears
      queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
      // Also refresh the task detail — its header shows the comment count
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
    },
  });
}
