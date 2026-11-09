"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  banUserAction,
  recordImpersonationAction,
  setUserRoleAction,
  unbanUserAction,
} from "@/features/admin/actions";
import { useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";

/**
 * Per-user admin actions (P05-T03): role, ban/unban and impersonation.
 *
 * Self-actions are hidden and refused server-side. Impersonation is audited before Better Auth
 * creates the session; the target must not be an admin (the plugin refuses it, and the button is
 * hidden for admins so there is no dead control).
 */
export function UserActions({
  userId,
  name,
  role,
  status,
  isSelf,
}: {
  userId: string;
  name: string;
  role: "STUDENT" | "INSTRUCTOR" | "ADMIN";
  status: "ACTIVE" | "BANNED" | "DELETED";
  isSelf: boolean;
}) {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [banOpen, setBanOpen] = useState(false);
  const [reason, setReason] = useState("");

  if (isSelf) {
    return <span className="text-xs text-muted-foreground">{t("selfNoActions")}</span>;
  }
  if (status === "DELETED") {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  async function changeRole(nextRole: string) {
    setPending(true);
    setError(null);
    const result = await setUserRoleAction({
      userId,
      role: nextRole as "STUDENT" | "INSTRUCTOR" | "ADMIN",
    });
    setPending(false);
    if (!result.ok) {
      setError(t("userActionFailed"));
      return;
    }
    router.refresh();
  }

  async function ban(): Promise<boolean> {
    if (reason.trim().length < 10) {
      setError(t("banReasonTooShort"));
      return false;
    }
    setPending(true);
    setError(null);
    const result = await banUserAction({ userId, reason });
    setPending(false);
    if (!result.ok) {
      setError(
        result.error.message.includes("REASON_TOO_SHORT")
          ? t("banReasonTooShort")
          : t("userActionFailed"),
      );
      return false;
    }
    setBanOpen(false);
    setReason("");
    router.refresh();
    return true;
  }

  async function unban(): Promise<boolean> {
    setPending(true);
    setError(null);
    const result = await unbanUserAction({ userId });
    setPending(false);
    if (!result.ok) {
      setError(t("userActionFailed"));
      return false;
    }
    router.refresh();
    return true;
  }

  async function impersonate(): Promise<boolean> {
    setPending(true);
    setError(null);
    const recorded = await recordImpersonationAction({ userId });
    if (!recorded.ok) {
      setPending(false);
      setError(t("userActionFailed"));
      return false;
    }

    const result = await authClient.admin.impersonateUser({ userId });
    setPending(false);
    if (result.error !== null && result.error !== undefined) {
      setError(t("userActionFailed"));
      return false;
    }

    router.push("/");
    router.refresh();
    return true;
  }

  return (
    <div className="flex min-w-48 flex-col gap-2">
      <Select
        aria-label={t("roleSelectLabel", { name })}
        value={role}
        disabled={pending}
        containerClassName="w-auto"
        className="h-8 pe-8 text-sm"
        onChange={(event) => {
          void changeRole(event.target.value);
        }}
      >
        <option value="STUDENT">{t("roleStudent")}</option>
        <option value="INSTRUCTOR">{t("roleInstructor")}</option>
        <option value="ADMIN">{t("roleAdmin")}</option>
      </Select>

      {error !== null && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-1">
        {status === "BANNED" ? (
          <ConfirmDialog
            triggerLabel={t("unban")}
            title={t("unbanTitle")}
            description={t("unbanBody")}
            confirmLabel={t("unbanConfirm")}
            cancelLabel={t("cancel")}
            errorLabel={t("userActionFailed")}
            onConfirm={unban}
          />
        ) : (
          <Dialog open={banOpen} onOpenChange={setBanOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="ghost" size="sm">
                {t("ban")}
              </Button>
            </DialogTrigger>
            <DialogContent closeLabel={t("cancel")}>
              <DialogHeader>
                <DialogTitle>{t("banTitle")}</DialogTitle>
                <DialogDescription>{name}</DialogDescription>
              </DialogHeader>
              <div className="mt-3 space-y-1">
                <Label htmlFor={`ban-reason-${userId}`}>{t("banReasonLabel")}</Label>
                <Textarea
                  id={`ban-reason-${userId}`}
                  rows={3}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                />
                <p className="text-xs text-muted-foreground">{t("banReasonHint")}</p>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setBanOpen(false)}>
                  {t("cancel")}
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  loading={pending}
                  onClick={() => {
                    void ban();
                  }}
                >
                  {pending ? t("banning") : t("banConfirm")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {role !== "ADMIN" && status === "ACTIVE" && (
          <ConfirmDialog
            triggerLabel={t("impersonate")}
            title={t("impersonateTitle")}
            description={t("impersonateBody", { name })}
            confirmLabel={t("impersonateConfirm")}
            cancelLabel={t("cancel")}
            errorLabel={t("userActionFailed")}
            onConfirm={impersonate}
          />
        )}
      </div>
    </div>
  );
}
