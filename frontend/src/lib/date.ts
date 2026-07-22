// lib/date.ts
// Shared date helpers for deadline math.
//
// The API returns due dates as date-only values with no timezone marker (the
// backend normalizes them to end-of-day with Kind=Unspecified, so the JSON has
// no trailing "Z"). `new Date(...)` therefore parses them in the browser's local
// zone, so we compare by the local calendar date — one convention shared across
// the app (dashboard + task cards) so the two screens can never disagree.

// Whole days from today to the given date, compared by calendar date rather than
// raw timestamps. Negative = overdue, 0 = today, positive = upcoming.
export function daysUntil(dateString: string): number {
  const due = new Date(dateString);
  const dueOnly = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const now = new Date();
  const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((dueOnly.getTime() - todayOnly.getTime()) / msPerDay);
}
