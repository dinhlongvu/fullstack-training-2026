// features/tasks/components/PriorityBadge.tsx
// Displays a color-coded priority badge.
// Low = gray, Medium = yellow, High = red.

import { cn } from "@/lib/utils"
import { type TaskPriority } from "../api/tasksApi";

interface PriorityBadgeProps {
    priority: TaskPriority;
}

// Map priority to Tailwind color classes
const PRIORITY_STYLES: Record<TaskPriority, string> = {
    Low: "bg-gray-100 text-gray-700",
    Medium: "bg-yellow-100 text-yellow-700",
    High: "bg-red-100 text-red-700",
};

export function PriorityBadge({ priority }: PriorityBadgeProps) {
    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                PRIORITY_STYLES[priority],
            )}
        >
            {priority}
        </span>
    );
}