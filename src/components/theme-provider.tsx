"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

/**
 * Theme provider (light / dark / system).
 *
 * `next-themes` writes a blocking script that applies the stored theme before the first paint, which
 * is what makes "no flash" possible; `<html>` already has `suppressHydrationWarning` because that
 * script legitimately changes the class before React hydrates. It also honours `prefers-color-scheme`
 * for the "system" option.
 */
export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="midad-theme"
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
