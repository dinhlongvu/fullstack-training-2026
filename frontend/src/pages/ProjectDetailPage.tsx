// pages/ProjectDetailPage.tsx — Kanban board (3 columns).
// TODO: Intern will implement the full Kanban board UI.

import { useParams } from 'react-router-dom';

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Project #{id}</h2>
      <p className="text-muted-foreground">
        TODO: Build 3-column Kanban board (Todo | In Progress | Done).
        <br />
        Fetch tasks with useQuery, render TaskCard in each column.
        <br />
        Use useMutation for status changes (PATCH /api/tasks/:id/status).
      </p>
    </div>
  );
}
