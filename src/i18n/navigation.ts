/**
 * Locale-aware navigation helpers.
 *
 * Every internal link must use these instead of `next/link` so the current locale prefix is kept
 * automatically and query strings survive a language switch — the product requirements.
 */

import { createNavigation } from "next-intl/navigation";

import { routing } from "./routing";

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
