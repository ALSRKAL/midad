"use client";

import { useEffect } from "react";

import { mergeGuestCartAction } from "@/features/cart/actions";
import { useRouter } from "@/i18n/navigation";

/**
 * Merges a guest cookie cart after any sign-in path (password, verification, OAuth).
 *
 * The layout renders this only when a session exists *and* the guest cookie is still present. The
 * server action performs the eligibility checks and deletes the cookie; a refresh then updates the
 * header count. Rendering nothing keeps it out of the accessibility tree.
 */
export function MergeGuestCart() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      // A sign-in response and this effect can overlap on Firefox; the first calls may see a
      // session that is not committed yet. Give the session five chances to appear.
      for (let attempt = 0; attempt < 5 && !cancelled; attempt += 1) {
        const result = await mergeGuestCartAction().catch(() => null);
        if (result?.ok === true) {
          // Refresh even when this component already unmounted. Deleting the guest cookie makes
          // the layout stop rendering this component, and that same render can be the one whose
          // header count is stale; suppressing the refresh leaves the badge empty (P15-T01).
          if (result.value.merged > 0) router.refresh();
          return;
        }
        if (cancelled) return;
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}
