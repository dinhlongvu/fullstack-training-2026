// pages/MyTasksPage.tsx — The full list behind the dashboard's overdue banner.
// Mode and page live in the URL, so the view is shareable and the browser's
// back button steps through pages.

import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ListTodo } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { isNetworkError } from "@/lib/api";
import { useMyTasksQuery } from "@/features/dashboard/api/useDashboard";
import { MyTaskList } from "@/features/dashboard/components/MyTaskList";
import { MyTasksSkeleton } from "@/features/dashboard/components/MyTasksSkeleton";
import { MyTasksPagination } from "@/features/dashboard/components/MyTasksPagination";
import { useProjectsQuery } from "@/features/projects/api/useProjects";

const PAGE_SIZE = 20;

export function MyTasksPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Only the exact string opts into the filter; anything else lists everything.
  const isUrgentOnly = searchParams.get("urgent") === "true";

  // A hand-edited or stale page param must never reach the API: page 0 makes
  // the backend skip a negative number of rows.
  const rawPage = searchParams.get("page");
  const parsedPage = Number(rawPage);
  const page =
    rawPage !== null && Number.isInteger(parsedPage) && parsedPage >= 1
      ? parsedPage
      : 1;

  const { data, isPending, isPlaceholderData, isFetching, error, refetch } =
    useMyTasksQuery({ page, pageSize: PAGE_SIZE, isUrgentOnly });

  // Project names are not in the my-tasks payload. This query is shared with
  // the projects list and the dashboard, so it is usually already cached.
  const { data: projects } = useProjectsQuery();

  const totalPages = data
    ? Math.max(1, Math.ceil(data.totalCount / PAGE_SIZE))
    : 1;

  // Tasks get closed while this list is open, so the page in the URL can end up
  // past the end — that returns an empty page, not an empty list. Rewrite the
  // URL to the last page that still exists (replace: no dead history entry).
  useEffect(() => {
    if (!data || page <= totalPages) return;

    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("page", String(totalPages));
        return next;
      },
      { replace: true },
    );
  }, [data, page, totalPages, setSearchParams]);

  function goToPage(nextPage: number) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("page", String(nextPage));
      return next;
    });
  }

  // While a placeholder is on screen the rows belong to a different page, so a
  // stale list cannot stand in for the page that just failed. Everywhere else
  // the rule is the usual one: keep working data rather than hide it.
  const showError = error !== null && (!data || isPlaceholderData);

  return (
    <div className="space-y-6">
      <Link
        to="/dashboard"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1 h-4 w-4" aria-hidden="true" />
        Back to dashboard
      </Link>

      <div className="space-y-1">
        <h2 className="text-2xl font-bold">
          {isUrgentOnly ? "Urgent tasks" : "My tasks"}
        </h2>
        {/* The urgent filter has no lower bound, so this list is wider than the
            overdue count that links here. Say so instead of letting the numbers
            look broken. */}
        <p className="text-sm text-muted-foreground">
          {isUrgentOnly
            ? "Open tasks that are overdue or due within the next 3 days."
            : "Every task assigned to you, across all projects."}
        </p>
      </div>

      {/* Loading — first load only; later pages keep the current rows. */}
      {isPending && <MyTasksSkeleton />}

      {showError && (
        <ErrorState
          message={
            // A dropped connection is not a server fault. Naming the wrong
            // cause sends the user looking for the wrong problem.
            isNetworkError(error)
              ? "Couldn't load your tasks. Check your connection and try again."
              : "Couldn't load your tasks. Try again in a moment."
          }
          retry={() => void refetch()}
          isRetrying={isFetching}
        />
      )}

      {/* Empty — the user genuinely has nothing matching the filter. */}
      {data && !showError && data.totalCount === 0 && (
        <EmptyState
          icon={ListTodo}
          title={isUrgentOnly ? "Nothing urgent" : "No tasks yet"}
          description={
            isUrgentOnly
              ? "Nothing is overdue and nothing is due in the next 3 days."
              : "Tasks assigned to you across all projects will show up here."
          }
        />
      )}

      {data && !showError && data.items.length > 0 && (
        <div className="space-y-4">
          {/* Dimmed while the next page loads: these rows are the previous one. */}
          <div
            aria-busy={isPlaceholderData}
            className={
              isPlaceholderData ? "opacity-60 transition-opacity" : undefined
            }
          >
            <MyTaskList tasks={data.items} projects={projects ?? []} />
          </div>

          {totalPages > 1 && (
            <MyTasksPagination
              page={page}
              totalPages={totalPages}
              onPageChange={goToPage}
            />
          )}
        </div>
      )}
    </div>
  );
}
