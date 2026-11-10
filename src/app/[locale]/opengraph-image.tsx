import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";

import { siteConfig } from "@/config/site";
import { publicEnv } from "@/env";

/** Dynamic, locale-aware Open Graph card (P11-T01). Self-hosted Arabic font keeps shaping correct. */

export const runtime = "nodejs";
export const alt = "Midad — مِداد";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const arabic = locale !== "en";
  const [font, t] = await Promise.all([
    readFile(join(process.cwd(), "assets/fonts/IBMPlexSansArabic-SemiBold.ttf")),
    getTranslations({ locale, namespace: "Metadata" }),
  ]);
  const hostname = new URL(publicEnv.NEXT_PUBLIC_SITE_URL).hostname;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: arabic ? "row-reverse" : "row",
        background: "#f7f4ee",
        color: "#16385f",
        fontFamily: "Plex Arabic",
      }}
    >
      <div
        style={{
          width: 22,
          height: "100%",
          background: "#c8891a",
        }}
      />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px 84px",
          gap: 26,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 20 }}>
          <div style={{ fontSize: 108, fontWeight: 600, lineHeight: 1 }}>
            {arabic ? siteConfig.name.ar : siteConfig.name.en}
          </div>
          <div style={{ fontSize: 34, color: "#9c6712" }}>
            {arabic ? siteConfig.name.en : siteConfig.name.ar}
          </div>
        </div>
        <div
          style={{
            fontSize: 40,
            lineHeight: 1.45,
            color: "#3b4654",
            maxWidth: 900,
          }}
        >
          {t("ogTagline")}
        </div>
        <div
          style={{
            marginTop: 18,
            height: 6,
            width: 220,
            background: "#c8891a",
            borderRadius: 999,
          }}
        />
        <div style={{ fontSize: 28, color: "#5c6775" }}>{hostname}</div>
      </div>
    </div>,
    {
      ...size,
      fonts: [{ name: "Plex Arabic", data: font, style: "normal", weight: 600 }],
    },
  );
}
