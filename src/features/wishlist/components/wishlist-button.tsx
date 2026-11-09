"use client";

import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { toggleWishlistAction } from "@/features/wishlist/actions";
import { useRouter } from "@/i18n/navigation";

/**
 * Wishlist toggle.
 *
 * A real toggle button (`aria-pressed`) rather than a label swap, so its state is announced. After a
 * successful call the server components are refreshed: on the wishlist page that removes the row,
 * on the course page it keeps the initial state correct on a later navigation.
 */
export function WishlistButton({
  courseId,
  initialWishlisted,
  className,
}: {
  courseId: string;
  initialWishlisted: boolean;
  className?: string;
}) {
  const t = useTranslations("Wishlist");
  const router = useRouter();
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setPending(true);
    setError(null);
    const result = await toggleWishlistAction({ courseId });
    setPending(false);

    if (!result.ok) {
      setError(t("error"));
      return;
    }

    setWishlisted(result.value.wishlisted);
    router.refresh();
  }

  return (
    <div className={className}>
      <Button
        type="button"
        variant="secondary"
        className="w-full"
        loading={pending}
        aria-pressed={wishlisted}
        onClick={() => {
          void toggle();
        }}
      >
        <Heart
          className={wishlisted ? "size-4 fill-current text-danger" : "size-4"}
          aria-hidden="true"
        />
        {wishlisted ? t("saved") : t("add")}
      </Button>
      {error !== null && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
