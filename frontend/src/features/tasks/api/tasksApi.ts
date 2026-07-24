// features/tasks/api/tasksApi.ts
// API functions for task management.
// All calls go through the shared apiClient.

import { apiClient } from "@/lib/api";

export type TaskStatus = "Todo" | "InProgress" | "Done";
export type TaskPriority = "Low" | "Medium" | "High";

// Shape of a task returned by GET /api/projects/{id}/tasks
export interface Task {
  id: number;
  projectId: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  createdAt: string;
  assigneeId: number | null;
  assigneeName: string | null;
  commentCount: number;
}

// Filter parameters for the tasks list endpoint
export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
}

// Fetch tasks for a project with optional filters
export function getProjectTasks(projectId: number, filters: TaskFilters = {}) {
  const params = new URLSearchParams();

  if (filters.status) params.set("status", filters.status);
  if (filters.priority) params.set("priority", filters.priority);
  if (filters.assigneeId) params.set("assigneeId", filters.assigneeId);

  const query = params.toString();
  const path = `/api/projects/${projectId}/tasks${query ? `?${query}` : ""}`;

  return apiClient<Task[]>(path);
}

// Map priority string to backend enum number
// Backend enum: Low=0, Medium=1, High=2
const PRIORITY_TO_NUMBER: Record<TaskPriority, number> = {
  Low: 0,
  Medium: 1,
  High: 2,
};

// Shape of the request body for POST /api/projects/{id}/tasks
export interface CreateTaskRequest {
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string | null;
  assigneeId: number | null;
}

// Create a new task in a project
// POST /api/projects/{projectId}/tasks
export function createTask(projectId: number, request: CreateTaskRequest) {
  return apiClient<Task>(`/api/projects/${projectId}/tasks`, {
    method: "POST",
    body: JSON.stringify({
      title: request.title,
      description: request.description,
      priority: PRIORITY_TO_NUMBER[request.priority],
      dueDate: request.dueDate,
      assigneeId: request.assigneeId,
    }),
  });
}

// Shape of the request body for PUT /api/tasks/{taskId}.
export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  priority?: TaskPriority; // IMPORTANT: PUT expects the STRING "Low"/"Medium"/"High" and REJECTS numbers (unlike POST)
  dueDate?: string | null;
  assigneeId?: number | null;
  clearAssignee?: boolean;
  clearDueDate?: boolean;
}

// Update a task's details.
// PUT /api/tasks/{taskId} — returns the updated task.
export function updateTask(taskId: number, request: UpdateTaskRequest) {
  return apiClient<Task>(`/api/tasks/${taskId}`, {
    method: "PUT",
    // Send priority as-is (string). Do NOT use PRIORITY_TO_NUMBER here —
    // the PUT endpoint parses a string and 400s on numeric input.
    body: JSON.stringify(request),
  });
}

// Used to compute prev/next status and disable buttons at the edges
export const TASK_STATUS_ORDER: TaskStatus[] = ["Todo", "InProgress", "Done"];

// Move a task to a new status
export function updateTaskStatus(taskId: number, status: TaskStatus) {
  return apiClient<Task>(`/api/tasks/${taskId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

// Assign or unassign a task to a project member
// PATCH /api/tasks/{taskId}/assign — pass null to unassign
export function assignTask(taskId: number, assigneeId: number | null) {
  return apiClient<Task>(`/api/tasks/${taskId}/assign`, {
    method: "PATCH",
    body: JSON.stringify({ assigneeId }),
  });
}

// Delete a task
// DELETE /api/tasks/{taskId} — returns 204 No Content
export function deleteTask(taskId: number) {
  return apiClient<void>(`/api/tasks/${taskId}`, {
    method: "DELETE",
  });
}

// Shape of a comment returned by GET /api/tasks/{id}/comments
export interface Comment {
  id: number;
  content: string;
  authorId: number;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

// Fetch a single task's detail
// GET /api/tasks/{taskId}
export function getTask(taskId: number) {
  return apiClient<Task>(`/api/tasks/${taskId}`);
}

// Fetch all comments for a task.
// The API already returns them sorted by createdAt ascending — no client-side sort needed.
// GET /api/tasks/{taskId}/comments
export function getTaskComments(taskId: number) {
  return apiClient<Comment[]>(`/api/tasks/${taskId}/comments`);
}

// Shape of the request body for POST /api/tasks/{id}/comments
export interface CreateCommentRequest {
  content: string;
}

// Add a comment to a task.
// POST /api/tasks/{taskId}/comments — returns 201 with the created comment
export function createComment(taskId: number, request: CreateCommentRequest) {
  return apiClient<Comment>(`/api/tasks/${taskId}/comments`, {
    method: "POST",
    body: JSON.stringify({ content: request.content }),
  });
}
