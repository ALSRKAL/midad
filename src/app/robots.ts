import type { MetadataRoute } from "next";

import { publicEnv } from "@/env";

/** robots.txt (P11-T01): public marketing/catalog only; private areas and APIs stay out. */

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const base = publicEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/ar/admin",
          "/en/admin",
          "/ar/instructor",
          "/en/instructor",
          "/ar/dashboard",
          "/en/dashboard",
          "/ar/settings",
          "/en/settings",
          "/ar/cart",
          "/en/cart",
          "/ar/checkout",
          "/en/checkout",
          "/ar/purchases",
          "/en/purchases",
          "/ar/notifications",
          "/en/notifications",
          "/ar/learn",
          "/en/learn",
          "/ar/preview",
          "/en/preview",
          "/ar/wishlist",
          "/en/wishlist",
          "/ar/login",
          "/en/login",
          "/ar/register",
          "/en/register",
          "/ar/forgot-password",
          "/en/forgot-password",
          "/ar/reset-password",
          "/en/reset-password",
          "/ar/verify",
          "/en/verify",
          "/api",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
