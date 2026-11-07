import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");
const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === "true" });

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  typedRoutes: true,
  // The web container ships only the traced server + static assets (P13-T02).
  output: "standalone",
  // Pin the workspace root so Turbopack never adopts a lockfile from a parent directory.
  turbopack: { root: import.meta.dirname },
  images: {
    // Course covers and avatars are served from our own S3/MinIO host, not a third party.
    // Next 16 refuses to optimize images from a private IP unless this is set; the local MinIO
    // runs on localhost, and image URLs are built server-side from stored keys (never from user
    // input), so this does not open an SSRF path. A public deployment uses its CDN hostname here.
    dangerouslyAllowLocalIP: true,
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
        pathname: "/midad-public/**",
      },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86_400,
  },
  experimental: {
    serverActions: { bodySizeLimit: "2mb" },
    // Tree-shake icon/UI/chart barrels whose index files would otherwise pull in every export.
    optimizePackageImports: ["lucide-react", "radix-ui", "recharts"],
  },
  // Baseline headers are applied to every route, including APIs that middleware does not match.
  // CSP is request-specific (nonce) and lives in middleware.
  headers() {
    return Promise.resolve([
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
        ],
      },
    ]);
  },
  // The invoice route reads the embedded Arabic fonts from disk; trace them into the server bundle.
  outputFileTracingIncludes: {
    "/api/orders/[id]/invoice": ["./assets/fonts/**/*"],
  },
};

export default withBundleAnalyzer(withNextIntl(nextConfig));
