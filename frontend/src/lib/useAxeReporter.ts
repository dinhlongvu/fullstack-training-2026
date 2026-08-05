// lib/useAxeReporter.ts
// Dev-only axe-core scan, logged to the browser console.

import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import { useLocation } from "react-router-dom";

export function useAxeReporter() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    // Re-run per route: @axe-core/react only rescans through
    // React.createElement and class lifecycles, and this app has neither.
    void import("@axe-core/react").then((axe) =>
      axe.default(React, ReactDOM, 1000),
    );
  }, [pathname]);
}
