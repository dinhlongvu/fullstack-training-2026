// The list screens used to blame the connection for every failure. A server
// that answered with an error is a different problem and needs a different
// message. Mirrors DetailPageOfflineMessage.test.tsx for the remaining screens.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { NetworkError } from "@/lib/api";
import { ProjectsPage } from "./ProjectsPage";
import { DashboardPage } from "./DashboardPage";
import { MyTasksPage } from "./MyTasksPage";
import { KanbanBoard } from "@/features/tasks/components/KanbanBoard";
import {
  useProjectsQuery,
  useCreateProjectMutation,
} from "@/features/projects/api/useProjects";
import {
  useMyStatsQuery,
  useMyTasksQuery,
} from "@/features/dashboard/api/useDashboard";
import {
  useProjectTasksQuery,
  useCreateTaskMutation,
} from "@/features/tasks/api/useTasks";
import { renderWithProviders } from "@/test/test-utils";

vi.mock("@/features/projects/api/useProjects");
vi.mock("@/features/dashboard/api/useDashboard");
vi.mock("@/features/tasks/api/useTasks");

// Shape of a settled query; each test overrides only the error it needs.
function settled(overrides: Record<string, unknown> = {}) {
  return {
    data: undefined,
    isPending: false,
    error: null,
    refetch: vi.fn(),
    isFetching: false,
    ...overrides,
  } as never;
}

beforeEach(() => {
  vi.clearAllMocks();

  // Create dialogs call these while closed, so they still need a return value.
  vi.mocked(useCreateProjectMutation).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as never);
  vi.mocked(useCreateTaskMutation).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as never);

  // The dashboard reads this one only to resolve project names.
  vi.mocked(useProjectsQuery).mockReturnValue(settled({ data: [] }));

  // The module mock returns undefined otherwise, and the page destructures it.
  vi.mocked(useMyTasksQuery).mockReturnValue(settled());
});

describe("list screens name the right cause when nothing loaded", () => {
  it("projects page blames the connection when the request never reached the server", () => {
    vi.mocked(useProjectsQuery).mockReturnValue(
      settled({ error: new NetworkError() }),
    );

    renderWithProviders(<ProjectsPage />);

    expect(screen.getByText(/check your connection/i)).toBeInTheDocument();
  });

  it("projects page does not blame the connection when the server answered", () => {
    vi.mocked(useProjectsQuery).mockReturnValue(
      settled({ error: new Error("HTTP 500") }),
    );

    renderWithProviders(<ProjectsPage />);

    expect(screen.getByText(/try again in a moment/i)).toBeInTheDocument();
    expect(screen.queryByText(/check your connection/i)).not.toBeInTheDocument();
  });

  it("dashboard blames the connection when the request never reached the server", () => {
    vi.mocked(useMyStatsQuery).mockReturnValue(
      settled({ error: new NetworkError() }),
    );

    renderWithProviders(<DashboardPage />);

    expect(screen.getByText(/check your connection/i)).toBeInTheDocument();
  });

  it("dashboard does not blame the connection when the server answered", () => {
    vi.mocked(useMyStatsQuery).mockReturnValue(
      settled({ error: new Error("HTTP 500") }),
    );

    renderWithProviders(<DashboardPage />);

    expect(screen.getByText(/try again in a moment/i)).toBeInTheDocument();
    expect(screen.queryByText(/check your connection/i)).not.toBeInTheDocument();
  });

  it("my tasks page blames the connection when the request never reached the server", () => {
    vi.mocked(useMyTasksQuery).mockReturnValue(
      settled({ error: new NetworkError() }),
    );

    renderWithProviders(<MyTasksPage />, ["/my-tasks?urgent=true"]);

    expect(screen.getByText(/check your connection/i)).toBeInTheDocument();
  });

  it("my tasks page does not blame the connection when the server answered", () => {
    vi.mocked(useMyTasksQuery).mockReturnValue(
      settled({ error: new Error("HTTP 500") }),
    );

    renderWithProviders(<MyTasksPage />, ["/my-tasks?urgent=true"]);

    expect(screen.getByText(/try again in a moment/i)).toBeInTheDocument();
    expect(screen.queryByText(/check your connection/i)).not.toBeInTheDocument();
  });

  it("kanban board blames the connection when the request never reached the server", () => {
    vi.mocked(useProjectTasksQuery).mockReturnValue(
      settled({ error: new NetworkError() }),
    );

    renderWithProviders(<KanbanBoard projectId={5} members={[]} />);

    expect(screen.getByText(/check your connection/i)).toBeInTheDocument();
  });

  it("kanban board does not blame the connection when the server answered", () => {
    vi.mocked(useProjectTasksQuery).mockReturnValue(
      settled({ error: new Error("HTTP 500") }),
    );

    renderWithProviders(<KanbanBoard projectId={5} members={[]} />);

    expect(screen.getByText(/try again in a moment/i)).toBeInTheDocument();
    expect(screen.queryByText(/check your connection/i)).not.toBeInTheDocument();
  });
});
