// features/dashboard/api/useDashboard.ts
// React Query hooks for dashboard data

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getMyStats, getMyTasks, type MyTasksParams } from "./dashboardApi";

// Cache key for the dashboard stats query
const DASHBOARD_STATS_QUERY_KEY = ["dashboard", "stats"];

// Hook to fetch the current user's dashboard stats
export function useMyStatsQuery() {
  return useQuery({
    queryKey: DASHBOARD_STATS_QUERY_KEY,
    queryFn: getMyStats,
  });
}

// Hook to fetch one page of the current user's tasks.
// Every param is part of the key, so page 2 can never serve page 1's rows.
export function useMyTasksQuery(params: MyTasksParams) {
  return useQuery({
    queryKey: ["dashboard", "my-tasks", params],
    queryFn: () => getMyTasks(params),
    // Keep the current page on screen while the next one loads. Swapping in a
    // skeleton would unmount the pager the user just clicked, dropping keyboard
    // focus to the body.
    placeholderData: keepPreviousData,
  });
}
