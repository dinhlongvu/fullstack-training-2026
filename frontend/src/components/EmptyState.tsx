// components/EmptyState.tsx — Shared "nothing here yet" block.
// Every list in the app renders this when it has zero items, so an empty
// result always looks the same: a muted icon, a title, one line of
// explanation, and an optional call to action.

import { type ReactNode } from "react";
import { type LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  // Optional call to action, e.g. a <Button> that opens the create dialog.
  action?: ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-6 py-12 text-center">
      {/* Decorative only — the title already carries the meaning. */}
      <Icon className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
      <div className="space-y-1">
        <p className="text-base font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}
