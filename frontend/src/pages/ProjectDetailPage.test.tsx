// Descriptions are stored raw, so a description saved with a run of Enter
// presses used to render as a wall of blank lines under `whitespace-pre-wrap`.
// That was #234, the twin of #233 on the task page.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { Routes, Route } from "react-router-dom";
import { ProjectDetailPage } from "./ProjectDetailPage";
import {
  useProjectDetailQuery,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useAddMemberMutation,
} from "@/features/projects/api/useProjects";
import { useAuthStore } from "@/stores/useAuthStore";
import { renderWithProviders } from "@/test/test-utils";
import { type ProjectDetailResponse } from "@/features/projects/api/projectsApi";

vi.mock("@/features/projects/api/useProjects");
vi.mock("@/stores/useAuthStore");

// The board below the description has its own data and its own tests. Stubbing
// it keeps this file from depending on every hook it happens to call.
vi.mock("@/features/tasks/components/KanbanBoard", () => ({
  KanbanBoard: () => null,
}));

const project: ProjectDetailResponse = {
  id: 5,
  name: "TaskBoard",
  description: "",
  createdAt: "2026-07-01T00:00:00Z",
  updatedAt: "2026-07-01T00:00:00Z",
  createdById: 1,
  members: [],
};

beforeEach(() => {
  vi.clearAllMocks();

  // The three dialogs stay mounted while closed, so their mutation hooks run.
  const idleMutation = { mutate: vi.fn(), isPending: false } as never;
  vi.mocked(useUpdateProjectMutation).mockReturnValue(idleMutation);
  vi.mocked(useDeleteProjectMutation).mockReturnValue(idleMutation);
  vi.mocked(useAddMemberMutation).mockReturnValue(idleMutation);

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

function mockProjectDescription(description: string) {
  vi.mocked(useProjectDetailQuery).mockReturnValue({
    data: { ...project, description },
    isPending: false,
    error: null,
    refetch: vi.fn(),
    isFetching: false,
  } as unknown as ReturnType<typeof useProjectDetailQuery>);
}

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/projects/:id" element={<ProjectDetailPage />} />
    </Routes>,
    [{ pathname: "/projects/5" }],
  );
}

describe("ProjectDetailPage description", () => {
  it("collapses the blank lines a description was saved with", () => {
    mockProjectDescription("First\n\n\n\n\n\nLast");
    renderPage();

    // The default matcher collapses whitespace, so it would pass with or
    // without the fix. Compare raw.
    expect(
      screen.getByText("First\n\nLast", { normalizer: (s) => s }),
    ).toBeInTheDocument();
  });

  it("shows the placeholder when a description is only blank lines", () => {
    mockProjectDescription("\n\n\n");
    renderPage();

    expect(screen.getByText("No description")).toBeInTheDocument();
  });
});
