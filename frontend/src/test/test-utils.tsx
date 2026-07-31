import { type ReactElement } from "react";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, type MemoryRouterProps } from "react-router-dom";

// Fresh QueryClient per render — avoids cache leaking between tests.
// retry disabled so failed queries settle immediately.
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
}

// InitialEntry, not string: entries can be objects carrying router state, which
// some pages read (e.g. TaskDetailPage restoring the board's filters).
export function renderWithProviders(
  ui: ReactElement,
  initialEntries: NonNullable<MemoryRouterProps["initialEntries"]> = ["/"],
) {
  const queryClient = createTestQueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}
