// features/tasks/components/KanbanBoard.tsx
// Main Kanban board: 3 columns (Todo, InProgress, Done).
// Fetches tasks via React Query, syncs filter state with URL query params.

import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanBoardSkeleton } from "./KanbanBoardSkeleton";
import { CreateTaskDialog } from "./CreateTaskDialog";
import { useProjectTasksQuery } from "../api/useTasks";
import { type Task, type TaskPriority } from "../api/tasksApi";
import { type ProjectMember } from "@/features/projects/api/projectsApi";

interface KanbanBoardProps {
    projectId: number;
    members: ProjectMember[];
}

// Column definitions for the Kanban board
const COLUMNS = [
    { status: "Todo" as const, title: "Todo" },
    { status: "InProgress" as const, title: "In Progress" },
    { status: "Done" as const, title: "Done" },
];

// Valid priority values for the filter dropdown
const PRIORITY_OPTIONS: TaskPriority[] = ["Low", "Medium", "High"];

export function KanbanBoard({ projectId, members }: KanbanBoardProps) {
    const [searchParams, setSearchParams] = useSearchParams();
    const [createDialogOpen, setCreateDialogOpen] = useState(false);

    // Read and validate filter values from URL query params
    const rawPriority = searchParams.get("priority");
    const priorityFilter: TaskPriority | null =
        rawPriority && PRIORITY_OPTIONS.includes(rawPriority as TaskPriority)
            ? (rawPriority as TaskPriority)
            : null;

    const rawAssignee = searchParams.get("assigneeId");
    const assigneeFilter =
        rawAssignee && /^\d+$/.test(rawAssignee) ? rawAssignee : null;

    // Fetch tasks — filters passed to API via query params
    const { data: tasks, isLoading, error } = useProjectTasksQuery(projectId, {
        priority: priorityFilter ?? undefined,
        assigneeId: assigneeFilter ?? undefined,
    });

    // Update a single filter while preserving other params
    function setFilter(key: string, value: string | null) {
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            if (value) {
                next.set(key, value);
            } else {
                next.delete(key);
            }
            return next;
        });
    }

    // Group tasks by status for column display
    function getTasksByStatus(status: string): Task[] {
        if (!tasks) return [];
        return tasks.filter((task) => task.status === status);
    }

    // Loading state
    if (isLoading) {
        return <KanbanBoardSkeleton />;
    }

    // Error state
    if (error) {
        return (
            <p className="py-8 text-center text-sm text-destructive">
                Failed to load tasks. Please try again.
            </p>
        );
    }

    return (
        <div className="space-y-4">
            {/* Toolbar: filters + New Task button */}
            <div className="flex flex-wrap items-center gap-3">
                {/* Priority filter */}
                <select
                    value={priorityFilter ?? ""}
                    onChange={(e) => setFilter("priority", e.target.value || null)}
                    className="rounded-md border bg-background px-3 py-1.5 text-sm"
                >
                    <option value="">All priorities</option>
                    {PRIORITY_OPTIONS.map((priority) => (
                        <option key={priority} value={priority}>
                            {priority}
                        </option>
                    ))}
                </select>

                {/* Assignee filter */}
                <select
                    value={assigneeFilter ?? ""}
                    onChange={(e) => setFilter("assigneeId", e.target.value || null)}
                    className="rounded-md border bg-background px-3 py-1.5 text-sm"
                >
                    <option value="">All assignees</option>
                    {members.map((member) => (
                        <option key={member.userId} value={String(member.userId)}>
                            {member.fullName}
                        </option>
                    ))}
                </select>

                {/* Clear all filters */}
                {(priorityFilter || assigneeFilter) && (
                    <button
                        onClick={() => setSearchParams({})}
                        className="text-sm text-muted-foreground underline hover:text-foreground"
                    >
                        Clear filters
                    </button>
                )}

                {/* New Task button — pushed to the right */}
                <Button
                    size="sm"
                    className="ml-auto"
                    onClick={() => setCreateDialogOpen(true)}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    New Task
                </Button>
            </div>

            {/* 3-column Kanban layout: responsive (stack on mobile) */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {COLUMNS.map((col) => (
                    <KanbanColumn
                        key={col.status}
                        title={col.title}
                        status={col.status}
                        tasks={getTasksByStatus(col.status)}
                    />
                ))}
            </div>

            {/* Create Task Dialog */}
            <CreateTaskDialog
                projectId={projectId}
                members={members}
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
            />
        </div>
    );
}
