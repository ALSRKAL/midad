"use client";

import { useEffect } from "react";

/**
 * Test-observable signal that React has hydrated the current document.
 *
 * E2E navigations wait for this attribute before clicking controls. `networkidle` guarantees the
 * HTML arrived, not that event handlers exist; Firefox under load occasionally clicked a
 * server-action button before hydration and the action never ran (P15-T01). The marker adds no
 * markup and no user-visible behaviour.
 */
export function HydrationMarker() {
  useEffect(() => {
    document.documentElement.dataset.hydrated = "true";
    return () => {
      delete document.documentElement.dataset.hydrated;
    };
  }, []);
  return null;
}
