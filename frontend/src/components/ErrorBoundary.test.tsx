import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";

import { ErrorBoundary } from "./ErrorBoundary";

// A component that throws on demand so we can trigger the boundary.
function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error("Boom");
  return <div>Safe content</div>;
}

describe("ErrorBoundary", () => {
  afterEach(() => vi.restoreAllMocks());

  it("renders children when there is no error", () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Safe content")).toBeInTheDocument();
  });

  it("renders the fallback Alert when a child throws", () => {
    // React logs the caught error to console.error — silence it for a clean run.
    vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Boom")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /try again/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /report issue/i }),
    ).toBeInTheDocument();
  });
});
