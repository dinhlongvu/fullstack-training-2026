// components/ErrorFallback.tsx — UI shown by an ErrorBoundary after a crash:
// a shadcn Alert with the error message, a "Try again" button, and a
// pre-filled "Report issue" GitHub link.

import { AlertTriangle, RefreshCw } from "lucide-react";

import { Alert, AlertTitle, AlertDescription } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { buildGitHubIssueUrl } from "@/lib/errorReporting";

interface ErrorFallbackProps {
  error: Error;
  onReset: () => void;
}

export function ErrorFallback({ error, onReset }: ErrorFallbackProps) {
  return (
    <Alert variant="destructive" className="mx-auto my-8 max-w-xl">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Something went wrong</AlertTitle>
      <AlertDescription className="space-y-4">
        <p className="break-words">{error.message || "Unexpected error."}</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={onReset}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
          <Button variant="link" size="sm" asChild>
            <a
              href={buildGitHubIssueUrl(error)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Report issue
            </a>
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
