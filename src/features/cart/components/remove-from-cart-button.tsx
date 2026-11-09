"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { removeFromCartAction } from "@/features/cart/actions";
import { useRouter } from "@/i18n/navigation";

/** Removes one line from the cart. The row disappears after the server confirms the new count. */
export function RemoveFromCartButton({ courseId, title }: { courseId: string; title: string }) {
  const t = useTranslations("Cart");
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setPending(true);
    setError(null);
    const result = await removeFromCartAction({ courseId });
    setPending(false);
    if (!result.ok) {
      setError(t("error"));
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        loading={pending}
        aria-label={t("removeItem", { title })}
        onClick={() => {
          void remove();
        }}
      >
        <Trash2 className="size-4" aria-hidden="true" />
        {pending ? t("removing") : t("remove")}
      </Button>
      {error !== null && (
        <p role="alert" className="mt-1 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
