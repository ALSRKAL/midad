"use client";

import { Check, ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { addToCartAction, enrollFreeAction, removeFromCartAction } from "@/features/cart/actions";
import { Link, useRouter } from "@/i18n/navigation";

/**
 * Course purchase action (P06-T01, BR-09).
 *
 * A guest can add to the cart: the cookie is written by the server action. An enrolled learner sees
 * a real link back to the curriculum instead of a buy button, and a free course enrolls without
 * Stripe. Nothing is optimistic about money: the server decides eligibility and count.
 */
export function AddToCartButton({
  courseId,
  slug,
  isFree,
  isAuthenticated,
  initialInCart,
  initialEnrolled,
  ownCourse,
  unavailable = false,
}: {
  courseId: string;
  slug: string;
  isFree: boolean;
  isAuthenticated: boolean;
  initialInCart: boolean;
  initialEnrolled: boolean;
  ownCourse: boolean;
  /** Archived/unlisted courses stay readable for enrolled learners but cannot be bought. */
  unavailable?: boolean;
}) {
  const t = useTranslations("Cart");
  const router = useRouter();
  const [inCart, setInCart] = useState(initialInCart);
  const [enrolled, setEnrolled] = useState(initialEnrolled);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (ownCourse) {
    return (
      <Button asChild variant="secondary" className="mt-4 w-full">
        <Link href={`/learn/${slug}`}>{t("ownCourse")}</Link>
      </Button>
    );
  }

  if (enrolled) {
    return (
      <Button asChild variant="secondary" className="mt-4 w-full">
        <Link href={`/learn/${slug}`}>{t("goToCourse")}</Link>
      </Button>
    );
  }

  if (unavailable) {
    return (
      <Button type="button" disabled className="mt-4 w-full">
        {t("courseUnavailable")}
      </Button>
    );
  }

  function errorMessage(detail: string): string {
    if (detail.includes("ALREADY_ENROLLED")) return t("alreadyEnrolled");
    if (detail.includes("SELF_PURCHASE_FORBIDDEN")) return t("selfPurchase");
    if (detail.includes("COURSE_UNAVAILABLE")) return t("courseUnavailable");
    if (detail.includes("CART_FULL")) return t("cartFull");
    if (detail.includes("COURSE_NOT_FREE")) return t("notFree");
    return t("error");
  }

  async function toggleCart() {
    setPending(true);
    setError(null);
    const result = inCart
      ? await removeFromCartAction({ courseId })
      : await addToCartAction({ courseId });
    setPending(false);
    if (!result.ok) {
      setError(errorMessage(result.error.message));
      return;
    }
    setInCart(result.value.inCart);
    router.refresh();
  }

  async function enrollFree() {
    setPending(true);
    setError(null);
    const result = await enrollFreeAction({ courseId });
    setPending(false);
    if (!result.ok) {
      setError(errorMessage(result.error.message));
      return;
    }
    setEnrolled(true);
    router.refresh();
  }

  if (isFree && !isAuthenticated) {
    return (
      <div className="mt-4">
        <Button asChild className="w-full">
          <Link href={`/login?next=${encodeURIComponent(`/courses/${slug}`)}`}>
            {t("signInFree")}
          </Link>
        </Button>
        {error !== null && (
          <p role="alert" className="mt-2 text-sm text-danger">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="mt-4">
      <Button
        type="button"
        className="w-full"
        variant={inCart && !isFree ? "secondary" : "primary"}
        loading={pending}
        aria-pressed={isFree ? undefined : inCart}
        onClick={() => {
          void (isFree ? enrollFree() : toggleCart());
        }}
      >
        {isFree ? (
          <>
            <Check className="size-4" aria-hidden="true" />
            {pending ? t("enrolling") : t("enrollFree")}
          </>
        ) : (
          <>
            <ShoppingBag className="size-4" aria-hidden="true" />
            {pending ? t("adding") : inCart ? t("inCart") : t("addToCart")}
          </>
        )}
      </Button>
      {!isFree && inCart && (
        <Link
          href="/cart"
          className="mt-2 block text-center text-sm font-medium text-primary hover:underline"
        >
          {t("viewCart")}
        </Link>
      )}
      {error !== null && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
