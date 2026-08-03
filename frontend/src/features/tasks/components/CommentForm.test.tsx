// A failed comment fetch must not cost the user their draft, and a failed POST
// must report itself without clearing the textarea.
//
// The aria-describedby test guards a regression that already happened once:
// setting that attribute by hand on the Textarea silently dropped FormControl's
// own link to FormMessage, because a child prop wins over the Slot's even when
// its value is undefined.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { CommentForm } from "./CommentForm";
import { useCreateCommentMutation } from "../api/useTasks";

vi.mock("../api/useTasks");
vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

const UNAVAILABLE =
  "Comments couldn't be loaded, so posting is unavailable right now.";

function mockMutation(mutate: unknown = vi.fn(), isPending = false) {
  vi.mocked(useCreateCommentMutation).mockReturnValue({
    mutate,
    isPending,
  } as unknown as ReturnType<typeof useCreateCommentMutation>);
}

function textbox() {
  return screen.getByRole("textbox");
}

function postButton() {
  return screen.getByRole("button", { name: /post comment|posting/i });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockMutation();
});

describe("CommentForm", () => {
  it("keeps the typed draft when the thread becomes unavailable", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<CommentForm taskId={12} />);

    await user.type(textbox(), "half-written thought");

    rerender(<CommentForm taskId={12} disabledReason={UNAVAILABLE} />);

    expect(textbox()).toHaveValue("half-written thought");
    expect(textbox()).toHaveAttribute("readonly");
    expect(textbox()).toHaveAccessibleDescription(new RegExp(UNAVAILABLE, "i"));
  });

  it("still points at the validation message when the form is usable", async () => {
    const user = userEvent.setup();
    render(<CommentForm taskId={12} />);

    await user.click(postButton());

    expect(screen.getByText(/cannot be empty/i)).toBeInTheDocument();
    expect(textbox()).toHaveAttribute("aria-invalid", "true");
    // The whole point: the message must be reachable from the field.
    expect(textbox()).toHaveAccessibleDescription(/cannot be empty/i);
  });

  it("reports a failed post and keeps the draft so it can be retried", async () => {
    const user = userEvent.setup();
    const mutate = vi.fn(
      (_vars: { content: string }, opts: { onError: (e: Error) => void }) =>
        opts.onError(new Error("Can't reach the server.")),
    );
    mockMutation(mutate);

    render(<CommentForm taskId={12} />);
    await user.type(textbox(), "keep me");
    await user.click(postButton());

    expect(toast.error).toHaveBeenCalledWith("Can't reach the server.");
    expect(textbox()).toHaveValue("keep me");
  });

  it("clears the textarea only after the post succeeds", async () => {
    const user = userEvent.setup();
    const mutate = vi.fn(
      (_vars: { content: string }, opts: { onSuccess: () => void }) =>
        opts.onSuccess(),
    );
    mockMutation(mutate);

    render(<CommentForm taskId={12} />);
    await user.type(textbox(), "posted");
    await user.click(postButton());

    expect(mutate).toHaveBeenCalledWith(
      { content: "posted" },
      expect.anything(),
    );
    expect(textbox()).toHaveValue("");
  });
});
