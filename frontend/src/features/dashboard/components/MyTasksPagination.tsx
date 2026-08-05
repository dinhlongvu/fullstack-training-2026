// features/dashboard/components/MyTasksPagination.tsx
// Previous/Next control for the My Tasks list. The current page lives in the
// URL, so this only reports the change upward.

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface MyTasksPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function MyTasksPagination({
  page,
  totalPages,
  onPageChange,
}: MyTasksPaginationProps) {
  return (
    <nav
      aria-label="Task list pages"
      className="flex items-center justify-between gap-3"
    >
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft className="mr-2 h-4 w-4" aria-hidden="true" />
        Previous
      </Button>

      {/* Focus stays on the button that moved the page, so without a live
          region nothing tells a screen reader the list changed. */}
      <p aria-live="polite" className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </p>

      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
        <ChevronRight className="ml-2 h-4 w-4" aria-hidden="true" />
      </Button>
    </nav>
  );
}
