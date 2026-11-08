import "server-only";

import { cookies } from "next/headers";

import { conflict, notFound } from "@/lib/errors";
import type { Currency } from "@/config/site";
import type { CouponErrorCode } from "@/lib/coupon-rules";
import { quote, type Quote } from "@/lib/money";
import { db } from "@/server/db";
import { env } from "@/env";
import { loadCoupon } from "@/server/coupons";
import { getPlatformSettings } from "@/server/platform-settings";
import type { SessionUser } from "@/server/session";

/**
 * Cart service (P06-T01, BR-09).
 *
 * A guest's cart lives in an httpOnly cookie containing course ids only. That is safe by design:
 * prices are never read from the cookie, and every id is re-validated against a published,
 * purchasable course on each render and again at checkout. Signing in merges the cookie into the
 * database with the same eligibility checks, then deletes it.
 */

export const GUEST_CART_COOKIE = "midad_cart";
export const CART_COUPON_COOKIE = "midad_coupon";
const GUEST_CART_MAX_ITEMS = 20;
const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 30;

function parseGuestIds(raw: string | undefined): string[] {
  if (raw === undefined || raw === "") return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<string>();
    for (const value of parsed) {
      if (typeof value !== "string") continue;
      if (value.length === 0 || value.length > 64) continue;
      seen.add(value);
      if (seen.size >= GUEST_CART_MAX_ITEMS) break;
    }
    return [...seen];
  } catch {
    return [];
  }
}

async function writeGuestIds(ids: string[]): Promise<void> {
  const store = await cookies();
  if (ids.length === 0) {
    store.delete(GUEST_CART_COOKIE);
    return;
  }
  store.set(GUEST_CART_COOKIE, JSON.stringify(ids.slice(0, GUEST_CART_MAX_ITEMS)), {
    httpOnly: true,
    sameSite: "lax",
    // Secure cookies are only meaningful over HTTPS. Keying this off NODE_ENV made the production
    // build on the local HTTP E2E origin reject the cookie in Firefox/WebKit, which silently lost
    // the guest cart. Production always has an https APP_URL.
    secure: env.APP_URL.startsWith("https://"),
    path: "/",
    maxAge: COOKIE_MAX_AGE_SEC,
  });
}

export async function readGuestCartIds(): Promise<string[]> {
  const store = await cookies();
  return parseGuestIds(store.get(GUEST_CART_COOKIE)?.value);
}

export async function readCouponCode(): Promise<string | null> {
  const store = await cookies();
  const value = store.get(CART_COUPON_COOKIE)?.value.trim();
  return value === undefined || value === "" ? null : value;
}

export async function writeCouponCode(code: string): Promise<void> {
  const store = await cookies();
  store.set(CART_COUPON_COOKIE, code, {
    httpOnly: true,
    sameSite: "lax",
    // Secure cookies are only meaningful over HTTPS. Keying this off NODE_ENV made the production
    // build on the local HTTP E2E origin reject the cookie in Firefox/WebKit, which silently lost
    // the guest cart. Production always has an https APP_URL.
    secure: env.APP_URL.startsWith("https://"),
    path: "/",
    maxAge: COOKIE_MAX_AGE_SEC,
  });
}

export async function clearCouponCode(): Promise<void> {
  const store = await cookies();
  store.delete(CART_COUPON_COOKIE);
}

export type CartAvailability = "ENROLLED" | "OWN_COURSE" | "UNAVAILABLE" | "FREE";

export type CartCourse = {
  id: string;
  slug: string;
  titleAr: string | null;
  titleEn: string | null;
  priceCents: number;
  isFree: boolean;
  currency: Currency;
  coverImageKey: string | null;
  totalDurationSec: number;
  instructorName: string;
  instructorProfileId: string;
  availability: CartAvailability | null;
};

export type CouponState =
  | { status: "NONE" }
  | { status: "INVALID"; code: string; reason: CouponErrorCode }
  | { status: "VALID"; couponId: string; code: string; discountCents: number };

export type CartView = {
  items: CartCourse[];
  quote: Quote;
  coupon: CouponState;
  /** Present when the lines cannot be priced together. */
  pricingError: "CURRENCY_MISMATCH" | null;
};

const EMPTY_QUOTE: Quote = {
  currency: "SAR",
  subtotalCents: 0,
  discountCents: 0,
  taxableCents: 0,
  taxCents: 0,
  totalCents: 0,
  lines: [],
};

function asCurrency(value: string): Currency {
  return value === "USD" ? "USD" : "SAR";
}

async function loadCartCourses(user: SessionUser | null): Promise<CartCourse[]> {
  const ids =
    user === null
      ? await readGuestCartIds()
      : (
          await db.cartItem.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "asc" },
            select: { courseId: true },
          })
        ).map((row) => row.courseId);
  if (ids.length === 0) return [];

  const rows = await db.course.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      slug: true,
      titleAr: true,
      titleEn: true,
      priceCents: true,
      isFree: true,
      currency: true,
      coverImageKey: true,
      totalDurationSec: true,
      status: true,
      instructorId: true,
      instructor: { select: { user: { select: { id: true, name: true } } } },
    },
  });
  const byId = new Map(rows.map((row) => [row.id, row]));

  const enrolledIds =
    user === null
      ? new Set<string>()
      : new Set(
          (
            await db.enrollment.findMany({
              where: { userId: user.id, courseId: { in: ids }, status: "ACTIVE" },
              select: { courseId: true },
            })
          ).map((row) => row.courseId),
        );

  const ordered: CartCourse[] = [];
  for (const id of ids) {
    const row = byId.get(id);
    if (row === undefined) continue;
    const availability: CartAvailability | null =
      row.status !== "PUBLISHED"
        ? "UNAVAILABLE"
        : user !== null && row.instructor.user.id === user.id
          ? "OWN_COURSE"
          : enrolledIds.has(row.id)
            ? "ENROLLED"
            : row.isFree
              ? "FREE"
              : null;
    ordered.push({
      id: row.id,
      slug: row.slug,
      titleAr: row.titleAr,
      titleEn: row.titleEn,
      priceCents: row.priceCents,
      isFree: row.isFree,
      currency: asCurrency(row.currency),
      coverImageKey: row.coverImageKey,
      totalDurationSec: row.totalDurationSec,
      instructorName: row.instructor.user.name,
      instructorProfileId: row.instructorId,
      availability,
    });
  }
  return ordered;
}

/** Loads the cart, evaluates the coupon cookie and returns the authoritative quote. */
export async function getCartView(
  user: SessionUser | null,
  options: { couponCode?: string | null } = {},
): Promise<CartView> {
  const items = await loadCartCourses(user);
  const settings = await getPlatformSettings();

  const purchasable = items.filter((item) => item.availability === null);
  const currencies = new Set(purchasable.map((item) => item.currency));
  if (currencies.size > 1) {
    return {
      items,
      quote: { ...EMPTY_QUOTE, currency: settings.defaultCurrency },
      coupon: { status: "NONE" },
      pricingError: "CURRENCY_MISMATCH",
    };
  }
  const currency: Currency = currencies.values().next().value ?? settings.defaultCurrency;

  const lines = purchasable.map((item) => ({
    courseId: item.id,
    unitPriceCents: item.priceCents,
  }));
  const code = options.couponCode === undefined ? await readCouponCode() : options.couponCode;
  let coupon: CouponState = { status: "NONE" };
  let discounts: number[] = lines.map(() => 0);

  if (code !== null && lines.length > 0) {
    const lookup = await loadCoupon(code, user?.id ?? null, lines);
    if (lookup !== null) {
      if (lookup.coupon === null || !lookup.evaluation.ok) {
        coupon = {
          status: "INVALID",
          code,
          reason: lookup.evaluation.ok ? "COUPON_NOT_FOUND" : lookup.evaluation.code,
        };
      } else {
        discounts = lookup.evaluation.lineDiscounts;
        coupon = {
          status: "VALID",
          couponId: lookup.coupon.id,
          code: lookup.coupon.code,
          discountCents: lookup.evaluation.discountCents,
        };
      }
    }
  }

  const priced = quote(
    lines.map((line, index) => ({
      unitPriceCents: line.unitPriceCents,
      discountCents: discounts[index] ?? 0,
    })),
    { currency, vatBps: settings.vatBps },
  );

  return { items, quote: priced, coupon, pricingError: null };
}

export async function getCartCount(user: SessionUser | null): Promise<number> {
  if (user === null) return (await readGuestCartIds()).length;
  return db.cartItem.count({ where: { userId: user.id } });
}

export type PurchaseState = { enrolled: boolean; inCart: boolean; ownCourse: boolean };

export async function getPurchaseState(
  user: SessionUser | null,
  courseId: string,
): Promise<PurchaseState> {
  if (user === null) {
    return {
      enrolled: false,
      inCart: (await readGuestCartIds()).includes(courseId),
      ownCourse: false,
    };
  }

  const [course, enrollment, cartItem] = await Promise.all([
    db.course.findUnique({
      where: { id: courseId },
      select: { instructor: { select: { userId: true } } },
    }),
    db.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId } },
      select: { status: true },
    }),
    db.cartItem.findUnique({
      where: { userId_courseId: { userId: user.id, courseId } },
      select: { id: true },
    }),
  ]);

  return {
    enrolled: enrollment?.status === "ACTIVE",
    inCart: cartItem !== null,
    ownCourse: course?.instructor.userId === user.id,
  };
}

export async function addCartItem(
  user: SessionUser | null,
  courseId: string,
): Promise<{ count: number; inCart: true }> {
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      status: true,
      isFree: true,
      instructor: { select: { userId: true } },
    },
  });
  if (course === null) throw notFound("Course not found");
  if (course.status !== "PUBLISHED") throw conflict("COURSE_UNAVAILABLE");
  if (course.isFree) throw conflict("COURSE_IS_FREE");

  if (user === null) {
    const ids = await readGuestCartIds();
    if (!ids.includes(courseId)) {
      if (ids.length >= GUEST_CART_MAX_ITEMS) throw conflict("CART_FULL");
      ids.push(courseId);
      await writeGuestIds(ids);
    }
    return { count: ids.length, inCart: true };
  }

  if (course.instructor.userId === user.id) throw conflict("SELF_PURCHASE_FORBIDDEN");
  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId } },
    select: { status: true },
  });
  if (enrollment?.status === "ACTIVE") throw conflict("ALREADY_ENROLLED");

  await db.cartItem.upsert({
    where: { userId_courseId: { userId: user.id, courseId } },
    create: { userId: user.id, courseId },
    update: {},
  });
  return { count: await getCartCount(user), inCart: true };
}

export async function removeCartItem(
  user: SessionUser | null,
  courseId: string,
): Promise<{ count: number; inCart: false }> {
  if (user === null) {
    const ids = await readGuestCartIds();
    const next = ids.filter((id) => id !== courseId);
    await writeGuestIds(next);
    return { count: next.length, inCart: false };
  }

  await db.cartItem.deleteMany({ where: { userId: user.id, courseId } });
  return { count: await getCartCount(user), inCart: false };
}

/** Merges the guest cookie into the signed-in user's database cart, then removes the cookie. */
export async function mergeGuestCart(userId: string): Promise<{ merged: number }> {
  const ids = await readGuestCartIds();
  if (ids.length === 0) return { merged: 0 };

  const courses = await db.course.findMany({
    where: { id: { in: ids }, status: "PUBLISHED", isFree: false },
    select: {
      id: true,
      instructor: { select: { userId: true } },
      enrollments: { where: { userId }, select: { status: true } },
    },
  });
  const eligible = courses.filter(
    (course) =>
      course.instructor.userId !== userId &&
      course.enrollments.every((enrollment) => enrollment.status !== "ACTIVE"),
  );

  if (eligible.length > 0) {
    await db.cartItem.createMany({
      data: eligible.map((course) => ({ userId, courseId: course.id })),
      skipDuplicates: true,
    });
  }
  await writeGuestIds([]);
  return { merged: eligible.length };
}
