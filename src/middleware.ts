import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";

import { routing } from "@/i18n/routing";

/**
 * Locale routing and maintenance mode.
 *
 * the product requirements is explicit that middleware is for routing, not authorization: every permission check
 * lives in the server layer (`createAction`, queries, route handlers).
 *
 * Middleware (Edge) cannot open Postgres, so it reads the admin's `maintenanceMode` setting through a
 * tiny public route on the same origin, cached for five seconds per isolate. The admin panel and the
 * auth/verification routes stay reachable so an operator can always turn maintenance off. The
 * `MAINTENANCE_MODE` environment variable remains an unconditional deployment override.
 */
const handleI18nRouting = createMiddleware(routing);

const MAINTENANCE_BYPASS = [
  "/admin",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify",
  "/maintenance",
  "/api",
  "/_next",
];

type MaintenanceCache = { enabled: boolean; expiresAt: number };
let maintenanceCache: MaintenanceCache | null = null;

async function maintenanceEnabled(request: NextRequest): Promise<boolean> {
  if (process.env["MAINTENANCE_MODE"] === "true") return true;
  if (maintenanceCache !== null && maintenanceCache.expiresAt > Date.now()) {
    return maintenanceCache.enabled;
  }
  try {
    const response = await fetch(new URL("/api/maintenance-status", request.nextUrl.origin), {
      cache: "no-store",
      signal: AbortSignal.timeout(1500),
    });
    if (!response.ok) return maintenanceCache?.enabled ?? false;
    const body = (await response.json()) as { enabled?: unknown };
    const enabled = body.enabled === true;
    maintenanceCache = { enabled, expiresAt: Date.now() + 5000 };
    return enabled;
  } catch {
    // Fail open: a settings read failure must not take the whole site down.
    return maintenanceCache?.enabled ?? false;
  }
}

function resolveLocale(pathname: string): string {
  const segment = pathname.split("/")[1] ?? "";
  return routing.locales.find((locale) => locale === segment) ?? routing.defaultLocale;
}

function createNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

function contentSecurityPolicy(nonce: string): string {
  const development = process.env.NODE_ENV === "development";
  // Local E2E serves images from an http MinIO origin; upgrading localhost to https breaks WebKit.
  const secureDeployment = (process.env["APP_URL"] ?? "").startsWith("https://");
  let assetOrigin = "";
  try {
    assetOrigin =
      process.env["S3_ENDPOINT"] === undefined ? "" : new URL(process.env["S3_ENDPOINT"]).origin;
  } catch {
    assetOrigin = "";
  }
  return [
    "default-src 'self'",
    // Next injects its bootstrap/chunks with this nonce; strict-dynamic covers their dynamic imports.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'wasm-unsafe-eval'${development ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${assetOrigin}`.trim(),
    `media-src 'self' blob: ${assetOrigin}`.trim(),
    "worker-src 'self' blob:",
    "font-src 'self' data:",
    `connect-src 'self' ${assetOrigin}${development ? " ws: wss:" : ""}`.trim(),
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    ...(secureDeployment ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}

function withSecurityHeaders(response: NextResponse, csp: string): NextResponse {
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()",
  );
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }
  return response;
}

export default async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const nonce = createNonce();
  const csp = contentSecurityPolicy(nonce);
  const bypass = MAINTENANCE_BYPASS.some(
    (prefix) =>
      pathname === prefix || pathname.startsWith(`${prefix}/`) || pathname.includes(prefix),
  );

  if (!bypass && (await maintenanceEnabled(request))) {
    const url = request.nextUrl.clone();
    url.pathname = `/${resolveLocale(pathname)}/maintenance`;
    return withSecurityHeaders(NextResponse.redirect(url), csp);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  // Next reads the nonce from this request header and applies it to every framework script.
  requestHeaders.set("Content-Security-Policy", csp);
  const routedRequest = new NextRequest(request, { headers: requestHeaders });
  return withSecurityHeaders(handleI18nRouting(routedRequest), csp);
}

export const config = {
  // Skip API routes, Next internals, and anything with a file extension (assets, icon, sitemap).
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
