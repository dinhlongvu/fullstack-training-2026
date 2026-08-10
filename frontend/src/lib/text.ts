// lib/text.ts
// Shared text helpers for display.

// Normalize newlines for display. Three steps:
//   1. Convert Windows CRLF (and any lone CR) to LF so line endings are uniform.
//   2. Empty a blank line that holds spaces or tabs, so step 3 still sees the newlines as a run.
//   3. Collapse any run of 3+ consecutive newlines down to 2 — i.e. allow AT MOST one blank line between paragraphs.
export function normalizeNewlines(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/\n[^\S\n]+(?=\n)/g, "\n")
    .replace(/\n{3,}/g, "\n\n");
}
