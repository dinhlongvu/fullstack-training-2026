// pages/DashboardPage.tsx — My stats + upcoming deadlines.
// TODO: Intern will implement.

export function DashboardPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Dashboard</h2>
      <p className="text-muted-foreground">
        TODO: Show task counts by status, upcoming deadlines (due within 3 days).
        <br />
        Fetch from GET /api/dashboard/my-stats.
      </p>
    </div>
  );
}
