// features/tasks/components/StatusBadge.tsx
// Displays a color-coded status badge.
// Todo = gray, InProgress = blue, Done = green.

import { cn } from "@/lib/utils";
import { type TaskStatus } from "../api/tasksApi";

interface StatusBadgeProps {
  status: TaskStatus;
}

// Map status to Tailwind color classes
const STATUS_STYLES: Record<TaskStatus, string> = {
  Todo: "bg-gray-100 text-gray-700",
  InProgress: "bg-blue-100 text-blue-700",
  Done: "bg-green-100 text-green-700",
};

// Human-readable label ("InProgress" -> "In Progress")
const STATUS_LABELS: Record<TaskStatus, string> = {
  Todo: "Todo",
  InProgress: "In Progress",
  Done: "Done",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        STATUS_STYLES[status],
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
