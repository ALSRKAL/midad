"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";

/**
 * Impersonation warning bar (P05-T03).
 *
 * Always visible while an admin uses another account, with a single way out. Stopping calls Better
 * Auth's stop endpoint, which restores the admin session, then lands on the users list.
 */
export function ImpersonationBanner({
  message,
  actionLabel,
}: {
  message: string;
  actionLabel: string;
}) {
  const router = useRouter();

  async function stop() {
    await authClient.admin.stopImpersonating();
    router.push("/admin/users");
    router.refresh();
  }

  return (
    <div className="bg-warning text-warning-foreground">
      <div className="mx-auto flex w-full max-w-(--container-page) flex-wrap items-center justify-between gap-2 px-6 py-2 text-sm">
        <p>{message}</p>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => {
            void stop();
          }}
        >
          {actionLabel}
        </Button>
      </div>
    </div>
  );
}
