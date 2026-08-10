// features/dashboard/api/dashboardApi.ts
// API functions for the dashboard feature
// All calls go through the shared apiClient (JWT token attached automatically)

import { apiClient } from "@/lib/api";
import {
  type TaskPriority,
  type TaskStatus,
} from "@/features/tasks/api/tasksApi";

// Task counts grouped by status
export interface TasksByStatus {
  todo: number;
  inProgress: number;
  done: number;
}

// A task due within the next 3 days.
export interface UpcomingDeadline {
  taskId: number;
  title: string;
  dueDate: string;
  projectId: number;
  priority: number;
}

// Shape of the GET /api/dashboard/my-stats response
export interface DashboardStats {
  tasksByStatus: TasksByStatus;
  upcomingDeadlines: UpcomingDeadline[];
  totalAssigned: number;
  overdueCount: number;
}

// Fetch the current user's dashboard stats
// GET /api/dashboard/my-stats — requires Bearer token
export function getMyStats() {
  return apiClient<DashboardStats>("/api/dashboard/my-stats");
}

// A task assigned to the current user.
// status/priority arrive as strings: the handler calls .ToString() on the enum
// (the numbers in the API issue's example are not what the endpoint returns).
export interface MyTask {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  projectId: number;
  assigneeId: number | null;
}

// Envelope every paginated endpoint returns. No totalPages — callers derive it.
export interface PaginatedList<TItem> {
  items: TItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface MyTasksParams {
  page: number;
  pageSize: number;
  isUrgentOnly: boolean;
}

// Fetch one page of the current user's tasks, soonest due date first.
// isUrgentOnly keeps open tasks due within 3 days — overdue ones included.
// GET /api/dashboard/my-tasks — requires Bearer token
export function getMyTasks({ page, pageSize, isUrgentOnly }: MyTasksParams) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    isUrgentOnly: String(isUrgentOnly),
  });

  return apiClient<PaginatedList<MyTask>>(
    `/api/dashboard/my-tasks?${params.toString()}`,
  );
}
