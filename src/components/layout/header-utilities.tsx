"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";

/**
 * Desktop-only header utilities (P15-T03).
 *
 * Theme and language controls are hidden below `lg`; on a phone the drawer owns both. Importing
 * them eagerly made every mobile page download and hydrate controls it cannot show. The media-query
 * store defers the dynamic import until a desktop viewport actually exists, while the server-rendered
 * skeleton reserves the same space so a desktop visitor does not get a header shift.
 */

const ThemeSwitch = dynamic(
  () => import("@/components/layout/theme-switch").then((module) => module.ThemeSwitch),
  { ssr: false, loading: () => null },
);

const LanguageSwitch = dynamic(
  () => import("@/components/layout/language-switch").then((module) => module.LanguageSwitch),
  { ssr: false, loading: () => null },
);

const QUERY = "(min-width: 1024px)";

function subscribe(callback: () => void): () => void {
  const query = window.matchMedia(QUERY);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

const getSnapshot = () => window.matchMedia(QUERY).matches;
// The server cannot know the viewport; the skeleton covers both cases and is hidden below lg.
const getServerSnapshot = () => false;

export function HeaderUtilities({ targetLocale }: { targetLocale: "ar" | "en" }) {
  const desktop = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!desktop) {
    return (
      <div className="hidden items-center gap-2 lg:flex" aria-hidden="true">
        <div className="h-8 w-[92px] rounded-md border border-border bg-muted/40" />
        <div className="h-9 w-[72px]" />
      </div>
    );
  }

  return (
    <div className="hidden items-center gap-2 lg:flex">
      <ThemeSwitch />
      <LanguageSwitch targetLocale={targetLocale} />
    </div>
  );
}
