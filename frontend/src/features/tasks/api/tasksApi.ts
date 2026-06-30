// features/tasks/api/tasksApi.ts
// API functions for task management.
// All calls go through the shared apiClient.

import { apiClient } from "@/lib/api";

export type TaskStatus = "Todo" | "InProgress" | "Done";
export type TaskPriority = "Low" | "Medium" | "High";

// Shape of a task returned by GET /api/projects/{id}/tasks
export interface Task {
    id: number;
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: string | null;
    createdAt: string;
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
