// Task title has trimmed since it was written; project name never did, so a
// name of only spaces passed client validation and came back as a 400. QA
// caught it reviewing #233/#234. Both dialogs share the rule, so both are here.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreateProjectDialog } from "./CreateProjectDialog";
import { EditProjectDialog } from "./EditProjectDialog";
import {
  useCreateProjectMutation,
  useUpdateProjectMutation,
} from "../api/useProjects";

vi.mock("../api/useProjects");
vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

const createMutate = vi.fn();
const updateMutate = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();

  vi.mocked(useCreateProjectMutation).mockReturnValue({
    mutate: createMutate,
    isPending: false,
  } as unknown as ReturnType<typeof useCreateProjectMutation>);

  vi.mocked(useUpdateProjectMutation).mockReturnValue({
    mutate: updateMutate,
    isPending: false,
  } as unknown as ReturnType<typeof useUpdateProjectMutation>);
});

function nameField() {
  return screen.getByLabelText(/name/i);
}

describe("Create project — name", () => {
  function renderDialog() {
    render(<CreateProjectDialog open onOpenChange={vi.fn()} />);
  }

  it("rejects a name of only spaces instead of letting the server 400", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.type(nameField(), "   ");
    await user.click(screen.getByRole("button", { name: "Create" }));

    expect(screen.getByText(/project name is required/i)).toBeInTheDocument();
    expect(createMutate).not.toHaveBeenCalled();
  });

  it("submits a real name with its surrounding spaces removed", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.type(nameField(), "  TaskBoard  ");
    await user.click(screen.getByRole("button", { name: "Create" }));

    expect(createMutate).toHaveBeenCalledWith(
      { name: "TaskBoard", description: "" },
      expect.anything(),
    );
  });
});

describe("Edit project — name", () => {
  function renderDialog() {
    render(
      <EditProjectDialog
        projectId={5}
        currentName="TaskBoard"
        currentDescription=""
        open
        onOpenChange={vi.fn()}
      />,
    );
  }

  it("rejects a name of only spaces instead of letting the server 400", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.clear(nameField());
    await user.type(nameField(), "   ");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(screen.getByText(/project name is required/i)).toBeInTheDocument();
    expect(updateMutate).not.toHaveBeenCalled();
  });
});
