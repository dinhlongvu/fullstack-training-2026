// pages/TaskDetailPage.tsx — Task detail + comments.
// TODO: Intern will implement.

import { useParams } from 'react-router-dom';

export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Task #{id}</h2>
      <p className="text-muted-foreground">
        TODO: Show task details, comment list, and comment form.
      </p>
    </div>
  );
}
