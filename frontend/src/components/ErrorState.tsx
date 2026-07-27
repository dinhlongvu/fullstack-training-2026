// components/ErrorState.tsx — Shared block for a failed data fetch.
//
// Not the same thing as ErrorFallback.tsx: that one is rendered BY the
// ErrorBoundary after a render-time crash. This one is rendered by a page
// itself when a React Query request rejects — async errors never reach an
// error boundary, so they need their own UI.

import { AlertTriangle, RefreshCw } from "lucide-react";

import { Alert, AlertTitle, AlertDescription } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  // A sentence written for the user. Never pass a raw API message
  // ("HTTP 500") straight through — the caller decides the wording.
  message: string;
  // Omitted when there is nothing to retry (e.g. a disabled query).
  retry?: () => void;
  // React Query keeps `error` set while a refetch is in flight, so without
  // this the button would look dead for the whole retry.
  isRetrying?: boolean;
}

export function ErrorState({
  message,
  retry,
  isRetrying = false,
}: ErrorStateProps) {
  return (
    <Alert variant="destructive" className="mx-auto my-8 max-w-xl">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Something went wrong</AlertTitle>
      <AlertDescription className="space-y-4">
        <p className="break-words">{message}</p>
        {retry && (
          <Button
            variant="outline"
            size="sm"
            onClick={retry}
            disabled={isRetrying}
          >
            <RefreshCw className={cn("h-4 w-4", isRetrying && "animate-spin")} />
            {isRetrying ? "Retrying..." : "Try again"}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
