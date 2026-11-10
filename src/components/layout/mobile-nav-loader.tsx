"use client";

import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { NavItem } from "@/components/layout/mobile-nav";

/**
 * Loads the mobile drawer (Radix Dialog + focus scope) only when the visitor opens it. The header
 * stays a server-rendered shell and the public bundle no longer pays for the dialog on first load.
 */
const MobileNav = dynamic(
  () => import("@/components/layout/mobile-nav").then((module) => module.MobileNav),
  { ssr: false, loading: () => null },
);

export function MobileNavLoader(props: {
  items: NavItem[];
  otherLocale: "ar" | "en";
  signedInName: string | null;
  cartCount: number;
  notificationCount: number;
}) {
  const t = useTranslations("Layout");
  const [enabled, setEnabled] = useState(false);

  if (!enabled) {
    return (
      <Button
        variant="ghost"
        size="icon"
        aria-label={t("openMenu")}
        className="lg:hidden"
        onClick={() => setEnabled(true)}
      >
        <Menu aria-hidden="true" />
      </Button>
    );
  }

  return <MobileNav {...props} initialOpen />;
}
