// The two detail pages take over the whole screen when their entity is
// missing, and the message they show names a cause. Requests now fail rather
// than pause when offline, so a dropped connection lands in that same branch,
// where "may have been deleted" would point at the wrong problem.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { Routes, Route } from "react-router-dom";
import { NetworkError } from "@/lib/api";
import { TaskDetailPage } from "./TaskDetailPage";
import { ProjectDetailPage } from "./ProjectDetailPage";
import {
  useTaskQuery,
  useTaskCommentsQuery,
  useCreateCommentMutation,
} from "@/features/tasks/api/useTasks";
import { useProjectDetailQuery } from "@/features/projects/api/useProjects";
import { useAuthStore } from "@/stores/useAuthStore";
import { renderWithProviders } from "@/test/test-utils";

vi.mock("@/features/tasks/api/useTasks");
vi.mock("@/features/projects/api/useProjects");
vi.mock("@/stores/useAuthStore");

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

  vi.mocked(useTaskCommentsQuery).mockReturnValue(settled({ data: [] }));
  vi.mocked(useCreateCommentMutation).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as never);

  vi.mocked(useAuthStore).mockImplementation((selector) =>
    selector({
      token: null,
      refreshToken: null,
      currentUser: null,
      setAuth: vi.fn(),
      setTokens: vi.fn(),
      clearAuth: vi.fn(),
    }),
  );
});

function renderTaskPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/tasks/:id" element={<TaskDetailPage />} />
    </Routes>,
    [{ pathname: "/tasks/12" }],
  );
}

function renderProjectPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/projects/:id" element={<ProjectDetailPage />} />
    </Routes>,
    [{ pathname: "/projects/5" }],
  );
}

describe("detail pages name the right cause when nothing loaded", () => {
  it("task page blames the connection when the request never reached the server", () => {
    vi.mocked(useTaskQuery).mockReturnValue(settled({ error: new NetworkError() }));
    vi.mocked(useProjectDetailQuery).mockReturnValue(settled());

    renderTaskPage();

    expect(screen.getByText(/check your connection/i)).toBeInTheDocument();
    expect(screen.queryByText(/may have been deleted/i)).not.toBeInTheDocument();
  });

  it("task page still blames a missing task when the server answered", () => {
    vi.mocked(useTaskQuery).mockReturnValue(
      settled({ error: new Error("Task not found") }),
    );
    vi.mocked(useProjectDetailQuery).mockReturnValue(settled());

    renderTaskPage();

    expect(screen.getByText(/may have been deleted/i)).toBeInTheDocument();
  });

  it("project page blames the connection when the request never reached the server", () => {
    vi.mocked(useProjectDetailQuery).mockReturnValue(
      settled({ error: new NetworkError() }),
    );

    renderProjectPage();

    expect(screen.getByText(/check your connection/i)).toBeInTheDocument();
    expect(screen.queryByText(/may have been deleted/i)).not.toBeInTheDocument();
  });

  it("project page still blames a missing project when the server answered", () => {
    vi.mocked(useProjectDetailQuery).mockReturnValue(
      settled({ error: new Error("Project not found") }),
    );

    renderProjectPage();

    expect(screen.getByText(/may have been deleted/i)).toBeInTheDocument();
  });
});
