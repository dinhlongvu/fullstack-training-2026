// features/dashboard/api/dashboardApi.ts
// API functions for the dashboard feature
// All calls go through the shared apiClient (JWT token attached automatically)

import { apiClient } from "@/lib/api";

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
