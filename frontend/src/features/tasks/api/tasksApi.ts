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

