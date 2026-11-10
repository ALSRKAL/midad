"use client";

import { useTranslations } from "next-intl";
import { Heart, LayoutDashboard } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/navigation";
import { signOut } from "@/lib/auth-client";

/**
 * Account area for a signed-in visitor.
 *
 * Shows the name (so the session is visibly real), a link to the settings page (§2.3) and a sign-out
 * button that also refreshes the server components, because the header and any dashboard are
 * rendered on the server and would otherwise keep showing the previous session.
 */
export function AccountMenu({ name }: { name: string }) {
  const t = useTranslations("Auth");
  const layoutT = useTranslations("Layout");
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    setPending(true);
    await signOut();
    router.refresh();
    router.push("/");
    setPending(false);
  }

  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-sm text-muted-foreground sm:inline" title={t("signedInAs")}>
        {name}
      </span>
      <Link
        href="/dashboard"
        aria-label={layoutT("navDashboard")}
        className="rounded-sm p-2 text-foreground hover:bg-muted"
      >
        <LayoutDashboard className="size-4" aria-hidden="true" />
      </Link>
      <Link
        href="/wishlist"
        aria-label={layoutT("navWishlist")}
        className="rounded-sm p-2 text-foreground hover:bg-muted"
      >
        <Heart className="size-4" aria-hidden="true" />
      </Link>
      <Link
        href="/settings"
        className="rounded-sm px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
      >
        {layoutT("navSettings")}
      </Link>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          void handleSignOut();
        }}
        loading={pending}
      >
        {t("signOut")}
      </Button>
    </div>
  );
}
