// lib/errorReporting.ts — Log a caught render error and build a pre-filled
// "Report issue" GitHub URL. Kept UI-agnostic so the ErrorBoundary (and any
// future endpoint reporter) can reuse it.

import { useAuthStore } from "@/stores/useAuthStore";

const GITHUB_NEW_ISSUE_URL =
  "https://github.com/dinhlongvu/fullstack-training-2026/issues/new";

// GitHub rejects issue URLs whose querystring is too long, so cap the stack.
const MAX_STACK_LENGTH = 1500;

export interface ReportedError {
  error: Error;
  componentStack: string;
}

// Log the error with everything needed to reproduce it: message + stack,
// the URL where it happened, and the current user (or "anonymous").
export function logError({ error, componentStack }: ReportedError): void {
  const { currentUser } = useAuthStore.getState();

  console.error("[ErrorBoundary] Uncaught render error", {
    message: error.message,
    stack: error.stack,
    componentStack,
    url: window.location.href,
    user: currentUser
      ? { id: currentUser.id, email: currentUser.email }
      : "anonymous",
  });
}

// Build a GitHub "New issue" link pre-filled with the error + current URL.
export function buildGitHubIssueUrl(error: Error): string {
  const stack = (error.stack ?? "(no stack trace)").slice(0, MAX_STACK_LENGTH);

  const title = `[BUG] Uncaught error: ${error.message}`;
  const body = [
    "## What happened",
    "The app crashed with an unexpected render error.",
    "",
    `**URL:** ${window.location.href}`,
    `**Error:** ${error.message}`,
    "",
    "## Stack trace",
    "```",
    stack,
    "```",
  ].join("\n");

  const params = new URLSearchParams({ title, body });
  return `${GITHUB_NEW_ISSUE_URL}?${params.toString()}`;
}
