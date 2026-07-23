// components/ErrorBoundary.tsx — React error boundary. MUST be a class: there is
// no hook equivalent. Catches render/lifecycle errors in its subtree, logs them,
// and renders a fallback instead of a blank screen.
//
// LIMITATION (React contract): error boundaries do NOT catch errors from event
// handlers, async code (promises / setTimeout), or the boundary's own render.
// Those still need try/catch or React Query's `error` state (see DashboardPage).

import { Component, type ErrorInfo, type ReactNode } from "react";

import { ErrorFallback } from "@/components/ErrorFallback";
import { logError } from "@/lib/errorReporting";

interface ErrorBoundaryProps {
  children: ReactNode;
  // Runs after the user clicks "Try again", once the boundary state is cleared.
  onReset?: () => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

// React may throw a non-Error value (e.g. `throw "boom"`); normalize so the
// fallback and logger always get a real Error.
function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value));
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  // Runs during render when a child throws → switch to the fallback UI.
  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { error: toError(error) };
  }

  // Runs after the fallback is committed → side effects (logging) go here.
  componentDidCatch(error: unknown, info: ErrorInfo): void {
    logError({
      error: toError(error),
      componentStack: info.componentStack ?? "",
    });
  }

  private handleReset = () => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.error) {
      return (
        <ErrorFallback error={this.state.error} onReset={this.handleReset} />
      );
    }
    return this.props.children;
  }
}

// Root-level: a crashed root usually can't soft-recover, so "Try again" does a
// full page reload after clearing state.
export function RootErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary onReset={() => window.location.reload()}>
      {children}
    </ErrorBoundary>
  );
}

// Page-level: a soft reset is enough — clearing state re-renders the page, and
// keying by route in Layout gives every page its own fresh boundary.
export function PageErrorBoundary({ children }: { children: ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}
