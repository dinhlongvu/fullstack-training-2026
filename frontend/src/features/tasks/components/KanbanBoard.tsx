// features/tasks/components/KanbanBoard.tsx
// Main Kanban board: 3 columns (Todo, InProgress, Done).
// Fetches tasks via React Query, syncs filter state with URL query params.

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, ListTodo, FilterX } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { isNetworkError } from "@/lib/api";
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

  let priorityFilter: TaskPriority | null = null;
  let needsPriorityCleanup = false;
  let validPriorityToSet: string | null = null;

  if (rawPriority) {
    if (PRIORITY_OPTIONS.includes(rawPriority as TaskPriority)) {
      priorityFilter = rawPriority as TaskPriority;
    } else {
      needsPriorityCleanup = true;
      // Split by comma and find the first valid priority
      const firstValid = rawPriority
        .split(",")
        .map((p) => p.trim())
        .find((p) => PRIORITY_OPTIONS.includes(p as TaskPriority));

      if (firstValid) {
        validPriorityToSet = firstValid;
        priorityFilter = firstValid as TaskPriority;
      }
    }
  }

  // An assignee is valid only if it matches a current project member.
  // An unknown value (typo, stale share link, hand-edited URL) is ignored.
  const rawAssignee = searchParams.get("assigneeId");
  const validAssigneeIds = new Set(members.map((m) => String(m.userId)));
  const assigneeFilter =
    rawAssignee && validAssigneeIds.has(rawAssignee) ? rawAssignee : null;
  const needsAssigneeCleanup = rawAssignee !== null && assigneeFilter === null;

  // Automatically strip invalid filter params from the URL without a full
  // page reload, so the address bar always reflects the active filters.
  useEffect(() => {
    if (!needsPriorityCleanup && !needsAssigneeCleanup) return;

    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (needsPriorityCleanup) {
          if (validPriorityToSet) {
            next.set("priority", validPriorityToSet);
          } else {
            next.delete("priority");
          }
        }
        if (needsAssigneeCleanup) {
          next.delete("assigneeId");
        }
        return next;
      },
      { replace: true },
    );
  }, [
    needsPriorityCleanup,
    validPriorityToSet,
    needsAssigneeCleanup,
    setSearchParams,
  ]);

  // Fetch tasks — filters passed to API via query params
  const {
    data: tasks,
    isPending,
    error,
    refetch,
    isFetching,
  } = useProjectTasksQuery(projectId, {
    priority: priorityFilter ?? undefined,
    assigneeId: assigneeFilter ?? undefined,
  });

  // Whether the user is looking at a filtered view — changes what an empty
  // result MEANS, and therefore what the empty state must say.
  const hasActiveFilters = priorityFilter !== null || assigneeFilter !== null;

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

  // Clear only the two filters this board owns 
  function clearFilters() {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("priority");
      next.delete("assigneeId");
      return next;
    });
  }

  // Group tasks by status for column display
  function getTasksByStatus(status: string): Task[] {
    if (!tasks) return [];
    return tasks.filter((task) => task.status === status);
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
            onClick={clearFilters}
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

      {/* Loading — skeleton columns, toolbar above stays usable.
          isPending, not isLoading: a paused offline query keeps isLoading
          false, which would leave this area blank. */}
      {isPending && <KanbanBoardSkeleton />}

      {/* Error — only when there is no cached board to fall back to */}
      {error && !tasks && (
        <ErrorState
          message={
            // A dropped connection is not a server fault. Naming the wrong
            // cause sends the user looking for the wrong problem.
            isNetworkError(error)
              ? "Couldn't load tasks for this project. Check your connection and try again."
              : "Couldn't load tasks for this project. Try again in a moment."
          }
          retry={() => void refetch()}
          isRetrying={isFetching}
        />
      )}

      {/* Empty — a filtered empty board is NOT the same as an empty project.
          Saying "No tasks yet" while a filter is on makes the user think
          their tasks were deleted. */}
      {tasks &&
        tasks.length === 0 &&
        (hasActiveFilters ? (
          <EmptyState
            icon={FilterX}
            title="No tasks match these filters"
            description="Try a different priority or assignee, or clear the filters."
            action={
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={ListTodo}
            title="No tasks yet"
            description="Create the first task to start filling the board."
            action={
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Task
              </Button>
            }
          />
        ))}

      {/* 3-column Kanban layout: responsive (stack on mobile) */}
      {tasks && tasks.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.status}
              title={col.title}
              status={col.status}
              tasks={getTasksByStatus(col.status)}
              projectId={projectId}
              members={members}
            />
          ))}
        </div>
      )}

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
