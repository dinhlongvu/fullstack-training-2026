// features/tasks/components/TaskCard.tsx
// Displays a single task as a card within a Kanban column.
// Shows title, priority badge, assignee initials, and due date.
// Click navigates to /tasks/:id.

import { useNavigate } from "react-router-dom";
import { Calendar, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { PriorityBadge } from "./PriorityBadge";
import { type Task } from "../api/tasksApi";

interface TaskCardProps {
    task: Task;
}

// Extract initials from a full name (e.g., "Alice Smith" → "AS")
function getInitials(name: string): string {
    return name
        .split(" ")
        .map((word) => word.charAt(0))
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

// Format due date for display (e.g., "Jun 30")
function formatDueDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Check if a due date is overdue (before today)
function isOverdue(dateString: string): boolean {
    return new Date(dateString) < new Date();
}

export function TaskCard({ task }: TaskCardProps) {
    const navigate = useNavigate();

    return (
        <Card
            className="cursor-pointer transition-shadow hover:shadow-md"
            onClick={() => navigate(`/tasks/${task.id}`)}
        >
            <CardContent className="p-4">
                {/* Priority badge */}
                <div className="mb-2">
                    <PriorityBadge priority={task.priority} />
                </div>

                {/* Task title */}
                <h4 className="text-sm font-medium leading-tight">{task.title}</h4>

                {/* Footer: assignee + due date */}
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    {/* Assignee initials */}
                    {task.assigneeName ? (
                        <div className="flex items-center gap-1" title={task.assigneeName}>
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-medium">
                                {getInitials(task.assigneeName)}
                            </span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 text-muted-foreground/50">
                            <User className="h-4 w-4" />
                            <span>Unassigned</span>
                        </div>
                    )}

                    {/* Due date */}
                    {task.dueDate && (
                        <div
                            className={`flex items-center gap-1 ${isOverdue(task.dueDate) && task.status !== "Done"
                                    ? "text-red-500"
                                    : ""
                                }`}
                        >
                            <Calendar className="h-3 w-3" />
                            <span>{formatDueDate(task.dueDate)}</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
