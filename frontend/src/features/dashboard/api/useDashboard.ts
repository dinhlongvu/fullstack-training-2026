// features/dashboard/api/useDashboard.ts
// React Query hooks for dashboard data

import { useQuery } from "@tanstack/react-query";
import { getMyStats } from "./dashboardApi";

// Cache key for the dashboard stats query
const DASHBOARD_STATS_QUERY_KEY = ["dashboard", "stats"];

// Hook to fetch the current user's dashboard stats
export function useMyStatsQuery() {
  return useQuery({
    queryKey: DASHBOARD_STATS_QUERY_KEY,
    queryFn: getMyStats,
  });
}
