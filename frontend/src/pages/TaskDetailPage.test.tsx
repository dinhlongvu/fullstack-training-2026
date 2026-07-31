// Guards the router-state contract between TaskCard and TaskDetailPage:
// TaskCard sends the board's query string as `state.boardSearch`, this page
// appends it to the back link. Nothing in the type system ties the two files
// together, so a change on either side would otherwise fail silently.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { Routes, Route } from "react-router-dom";
import { TaskDetailPage } from "./TaskDetailPage";
import {
  useTaskQuery,
  useTaskCommentsQuery,
  useCreateCommentMutation,
} from "@/features/tasks/api/useTasks";
import { useProjectDetailQuery } from "@/features/projects/api/useProjects";
import { useAuthStore } from "@/stores/useAuthStore";
import { renderWithProviders } from "@/test/test-utils";
import { type Task } from "@/features/tasks/api/tasksApi";

vi.mock("@/features/tasks/api/useTasks");
vi.mock("@/features/projects/api/useProjects");
vi.mock("@/stores/useAuthStore");

const task: Task = {
  id: 12,
  projectId: 5,
  title: "Implement login page",
  description: "",
  status: "Todo",
  priority: "Low",
  dueDate: null,
  createdAt: "2026-07-01T00:00:00Z",
  assigneeId: null,
  assigneeName: null,
  commentCount: 0,
};

beforeEach(() => {
  vi.clearAllMocks();

  vi.mocked(useTaskQuery).mockReturnValue({
    data: task,
    isPending: false,
    error: null,
    refetch: vi.fn(),
    isFetching: false,
  } as unknown as ReturnType<typeof useTaskQuery>);

  vi.mocked(useTaskCommentsQuery).mockReturnValue({
    data: [],
    isPending: false,
    error: null,
    refetch: vi.fn(),
    isFetching: false,
  } as unknown as ReturnType<typeof useTaskCommentsQuery>);

  vi.mocked(useProjectDetailQuery).mockReturnValue({
    data: undefined,
    isPending: false,
    error: null,
  } as unknown as ReturnType<typeof useProjectDetailQuery>);

  // CommentForm renders below the task, and its hook comes from the same
  // mocked module — without this it would be undefined and crash the render.
  vi.mocked(useCreateCommentMutation).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useCreateCommentMutation>);

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

// The page reads :id from the URL, so it needs a real route match.
function renderWithState(state?: unknown) {
  return renderWithProviders(
    <Routes>
      <Route path="/tasks/:id" element={<TaskDetailPage />} />
    </Routes>,
    [{ pathname: "/tasks/12", state }],
  );
}

function backLink() {
  return screen.getByRole("link", { name: /back to project/i });
}

describe("TaskDetailPage back link", () => {
  it("restores the board filters carried in router state", () => {
    renderWithState({ boardSearch: "?priority=High&assigneeId=3" });

    expect(backLink()).toHaveAttribute(
      "href",
      "/projects/5?priority=High&assigneeId=3",
    );
  });

  it("points at the plain board when there is no state (e.g. from the Dashboard)", () => {
    renderWithState(undefined);

    expect(backLink()).toHaveAttribute("href", "/projects/5");
  });

  it("ignores a state value that is not a query string", () => {
    renderWithState({ boardSearch: "javascript:alert(1)" });

    expect(backLink()).toHaveAttribute("href", "/projects/5");
  });
});
