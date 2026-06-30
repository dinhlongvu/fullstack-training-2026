// features/tasks/components/KanbanColumn.tsx
// A single column of the Kanban board.
// Displays a header with column name + task count, and a list of TaskCards.

import { TaskCard } from "./TaskCard";
import { type Task, type TaskStatus } from "../api/tasksApi";

interface KanbanColumnProps {
    title: string;
    status: TaskStatus;
    tasks: Task[];
}

// Map status to header accent color
const STATUS_COLORS: Record<TaskStatus, string> = {
    Todo: "bg-blue-500",
    InProgress: "bg-amber-500",
    Done: "bg-green-500",
};

export function KanbanColumn({ title, status, tasks }: KanbanColumnProps) {
    return (
        <div className="flex flex-col rounded-lg bg-muted/30 p-3">
            {/* Column header */}
            <div className="mb-3 flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${STATUS_COLORS[status]}`} />
                <h3 className="text-sm font-semibold">{title}</h3>
                <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {tasks.length}
                </span>
            </div>

            {/* Task cards list */}
            <div className="flex flex-1 flex-col gap-2">
                {tasks.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                        No tasks
                    </p>
                ) : (
                    tasks.map((task) => <TaskCard key={task.id} task={task} />)
                )}
            </div>
        </div>
    );
}
