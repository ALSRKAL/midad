"use client";

import { useEffect } from "react";

import { removeCouponAction } from "@/features/cart/actions";
import { useRouter } from "@/i18n/navigation";

/** Clears the applied coupon after a paid order so the next cart does not inherit its discount. */
export function ClearCouponOnMount() {
  const router = useRouter();

  useEffect(() => {
    void (async () => {
      const result = await removeCouponAction();
      if (result.ok) router.refresh();
    })();
  }, [router]);

  return null;
}
