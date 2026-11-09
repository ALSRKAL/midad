"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteAccountAction } from "@/features/account/actions";
import { useAccountError } from "@/features/account/components/use-account-error";
import { useRouter } from "@/i18n/navigation";
import { signOut } from "@/lib/auth-client";

/**
 * Delete account (the product requirements: soft delete with confirmation).
 *
 * Typing the account's email is the confirmation — a stray click cannot delete anything. The server
 * re-checks the address, sets status DELETED and deletedAt, and removes every session; the row and
 * the financial/learning history remain.
 */
export function DeleteAccountDialog({ email }: { email: string }) {
  const t = useTranslations("Account");
  const errorMessage = useAccountError();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setPending(true);
    setError(null);

    const result = await deleteAccountAction({ confirmEmail });
    if (!result.ok) {
      setPending(false);
      setError(errorMessage(result.error));
      return;
    }

    // The session rows are gone; clear the cookie so the browser does not keep sending a dead token.
    await signOut().catch(() => undefined);
    setPending(false);
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setConfirmEmail("");
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="danger">
          {t("deleteAccount")}
        </Button>
      </DialogTrigger>

      <DialogContent closeLabel={t("close")}>
        <DialogHeader>
          <DialogTitle>{t("deleteDialogTitle")}</DialogTitle>
          <DialogDescription>{t("deleteDialogBody")}</DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-2">
          <Label htmlFor="delete-confirm-email">{t("deleteConfirmLabel")}</Label>
          <p className="text-sm text-muted-foreground" dir="ltr">
            {email}
          </p>
          <Input
            id="delete-confirm-email"
            type="email"
            dir="ltr"
            autoComplete="off"
            value={confirmEmail}
            onChange={(event) => setConfirmEmail(event.target.value)}
          />
        </div>

        {error !== null && (
          <p role="alert" className="mt-3 text-sm text-danger">
            {error}
          </p>
        )}

        <DialogFooter>
          <Button type="button" variant="ghost" disabled={pending} onClick={() => setOpen(false)}>
            {t("deleteCancel")}
          </Button>
          <Button
            type="button"
            variant="danger"
            loading={pending}
            onClick={() => {
              void handleDelete();
            }}
          >
            {pending ? t("deleting") : t("deleteConfirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
