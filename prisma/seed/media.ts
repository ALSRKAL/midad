/**
 * Seed media generation.
 *
 * Nothing binary is committed to the repository (the product requirements). Instead the seeder generates:
 *   • short lesson videos with ffmpeg — a visible frame counter makes progress tracking verifiable
 *     by eye, and a colour change at the 90% mark matches BR-14;
 *   • course covers with ImageMagick — geometric "ink & paper" compositions derived deterministically
 *     from the course slug (no photography, see docs/DECISIONS.md ADR-0013);
 *   • lesson handout PDFs with ImageMagick, whose visible text is Latin because Arabic shaping needs
 *     the Chromium pipeline introduced in P06/P08.
 *
 * Everything is deterministic: the same seed run produces byte-identical media, so `pnpm db:seed`
 * is reproducible and review diffs of generated assets are empty.
 */

import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);

export const SEED_MEDIA_DIR = join(process.cwd(), "prisma", "seed", ".media");

/** A short, self-describing clip. `durationSec` is stored on the lesson, so BR-14 is testable. */
export type GeneratedVideo = {
  key: string;
  path: string;
  /** Demo VTT shipped with the synthetic clip so the player's caption path is exercised. */
  captionsKey: string;
  captionsPath: string;
  durationSec: number;
  sizeBytes: number;
};

export type GeneratedImage = {
  key: string;
  path: string;
  width: number;
  height: number;
};

export type GeneratedDocument = {
  key: string;
  path: string;
};

/* ------------------------------------------------------------------ *
 * Deterministic helpers                                               *
 * ------------------------------------------------------------------ */

/** Stable 32-bit hash of a string — used to derive per-course visuals. */
export function hashOf(value: string): number {
  const digest = createHash("sha256").update(value).digest();
  return digest.readUInt32BE(0);
}

/** Derives an integer in [min, max] from a seed string and a salt. */
export function pick(value: string, salt: string, min: number, max: number): number {
  const hash = hashOf(`${value}:${salt}`);
  return min + (hash % (max - min + 1));
}

/* ------------------------------------------------------------------ *
 * Videos                                                             *
 * ------------------------------------------------------------------ */

const VIDEO_DURATIONS = [6, 8, 10, 12] as const;

/**
 * ffmpeg filter: paper background, a large frame counter (so a viewer can see time moving) and a
 * saffron wash during the last 10% — the visual cue for the 90% completion rule (BR-14).
 */
function videoFilter(durationSec: number, fontFile: string | undefined): string {
  const flashStart = (durationSec * 0.9).toFixed(2);
  const font = fontFile === undefined ? "" : `fontfile='${fontFile}':`;
  return [
    `drawtext=${font}text='%{eif\\:t\\:d}s':fontcolor=0x1A1F26:fontsize=180:x=(w-text_w)/2:y=(h-text_h)/2`,
    `drawtext=${font}text='frame %{n}':fontcolor=0x5B6470:fontsize=42:x=(w-text_w)/2:y=h-140`,
    `drawbox=x=0:y=0:w=iw:h=24:color=0x16385F@0.9:t=fill`,
    `drawbox=x=0:y=ih-24:w=iw:h=24:color=0x16385F@0.9:t=fill`,
    `drawbox=x=0:y=0:w=iw:h=ih:color=0xC8891A@0.12:t=fill:enable='gte(t,${flashStart})'`,
  ].join(",");
}

export async function generateVideos(log: (message: string) => void): Promise<GeneratedVideo[]> {
  const videosDir = join(SEED_MEDIA_DIR, "videos");
  await mkdir(videosDir, { recursive: true });

  const fontFile = await resolveFontFile();
  const videos: GeneratedVideo[] = [];

  for (const durationSec of VIDEO_DURATIONS) {
    const path = join(videosDir, `lesson-${durationSec}s.mp4`);
    await run("ffmpeg", [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-f",
      "lavfi",
      "-i",
      "color=c=0xFAF8F4:s=1280x720:r=25",
      "-vf",
      videoFilter(durationSec, fontFile),
      "-t",
      String(durationSec),
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "30",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      "-an",
      path,
    ]);
    const size = (await stat(path)).size;
    const captionsPath = join(videosDir, `lesson-${durationSec}s.vtt`);
    const end = `00:00:${String(durationSec).padStart(2, "0")}.000`;
    await writeFile(
      captionsPath,
      [
        "WEBVTT",
        "",
        `00:00:00.000 --> ${end}`,
        "فيديو تجريبي قصير من مِداد للتحقق من المشغل والتقدم.",
        "",
      ].join("\n"),
      "utf8",
    );
    videos.push({
      key: `seed/videos/lesson-${durationSec}s.mp4`,
      path,
      captionsKey: `seed/videos/lesson-${durationSec}s.vtt`,
      captionsPath,
      durationSec,
      sizeBytes: size,
    });
    log(`video ${durationSec}s · ${(size / 1024).toFixed(0)} KiB`);
  }

  return videos;
}

/** Returns a usable font file for drawtext, or undefined to let ffmpeg pick its default. */
async function resolveFontFile(): Promise<string | undefined> {
  const candidates = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
  ];
  for (const candidate of candidates) {
    try {
      await stat(candidate);
      return candidate;
    } catch {
      continue;
    }
  }
  return undefined;
}

/* ------------------------------------------------------------------ *
 * Course covers                                                      *
 * ------------------------------------------------------------------ */

const INK = "#16385F";
const PAPER = "#FAF8F4";
const SAFFRON = "#C8891A";
const MUTED = "#5B6470";

/**
 * Composes a cover from deterministic geometry: a large ink quarter-disc anchored to one corner
 * (the composition's anchor), a thin ring in the opposite half, three ruled lines and one saffron
 * bar. No text — covers read as diagrams, and text would need the real font pipeline.
 *
 * Every primitive sets its own `fill`/`stroke` so shapes cannot inherit a previous fill.
 */
function coverArgs(slug: string): string[] {
  const radius = pick(slug, "radius", 420, 620);
  const corner = pick(slug, "corner", 0, 3);
  const anchors: Array<[number, number]> = [
    [0, 0],
    [1280, 0],
    [0, 720],
    [1280, 720],
  ];
  const [ax, ay] = anchors[corner] ?? [0, 0];

  const ringX = pick(slug, "ringX", 380, 900);
  const ringY = pick(slug, "ringY", 220, 500);
  const ringR = pick(slug, "ringR", 120, 190);
  const ringStart = pick(slug, "ringStart", 0, 359);
  const ringArc = pick(slug, "ringArc", 70, 240);
  const ruleCount = pick(slug, "rules", 3, 4);
  const barX = pick(slug, "barX", 940, 1120);

  const draws: string[] = [
    `fill ${PAPER} stroke none rectangle 0,0 1280,720`,
    `fill ${INK} stroke none circle ${ax},${ay} ${ax + radius},${ay}`,
    `fill none stroke ${PAPER} stroke-width 3 rectangle 48,48 1232,672`,
    `fill none stroke ${INK} stroke-width 6 ellipse ${ringX},${ringY} ${ringR},${Math.round(ringR * 0.6)} ${ringStart},${ringStart + ringArc}`,
    `fill ${SAFFRON} stroke none rectangle ${barX},${560} ${barX + 140},${604}`,
  ];

  for (let index = 0; index < ruleCount; index += 1) {
    const y = 470 + index * 30;
    const width = pick(slug, `rule-${index}`, 200, 430);
    draws.push(`fill none stroke ${MUTED} stroke-width 6 line 120,${y} ${120 + width},${y}`);
  }

  return ["-size", "1280x720", "xc:" + PAPER, "-depth", "8", "-draw", draws.join(" ")];
}

export async function generateCover(slug: string): Promise<GeneratedImage> {
  const coversDir = join(SEED_MEDIA_DIR, "covers");
  await mkdir(coversDir, { recursive: true });
  const path = join(coversDir, `${slug}.png`);

  await run("convert", [...coverArgs(slug), "-strip", "-define", "png:compression-level=9", path]);

  return { key: `seed/covers/${slug}.png`, path, width: 1280, height: 720 };
}

/* ------------------------------------------------------------------ *
 * Handout PDFs                                                       *
 * ------------------------------------------------------------------ */

/**
 * A one-page handout, written as a small vector PDF (a few kilobytes) rather than a rasterised
 * image, so the text stays selectable and the seeder stays fast.
 *
 * Visible text is Latin on purpose: Arabic shaping in PDFs is the Chromium pipeline's job
 * (P06-T05 invoices, P08-T03 certificates) and pretending otherwise here would ship broken Arabic.
 * The document exists so FILE lessons have a real, openable attachment.
 */
export async function generateHandout(
  slug: string,
  englishTitle: string,
): Promise<GeneratedDocument> {
  const docsDir = join(SEED_MEDIA_DIR, "docs");
  await mkdir(docsDir, { recursive: true });
  const path = join(docsDir, `${slug}.pdf`);

  const latin = (value: string): string =>
    value
      .replace(/[^\u0020-\u007E]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 70);

  const title = latin(englishTitle) || "Lesson handout";
  const reference = latin(slug);

  const lines: Array<{ text: string; size: number; y: number }> = [
    { text: "Midad - lesson handout", size: 11, y: 790 },
    { text: title, size: 24, y: 730 },
    { text: `Reference document: ${reference}`, size: 12, y: 690 },
    {
      text: "Replace this generated handout with the instructor's real file in the builder.",
      size: 12,
      y: 660,
    },
    { text: "Generated by prisma/seed/media.ts - not a user-uploaded document.", size: 10, y: 630 },
  ];

  const escapePdfText = (value: string): string =>
    value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

  const content = [
    "0.063 0.220 0.373 rg 0 782 595 60 re f",
    "1 0 0 rg",
    ...lines.map(
      (line) =>
        `BT /F1 ${line.size} Tf 1 0 0 1 56 ${line.y} Tm (${escapePdfText(line.text)}) Tj ET`,
    ),
    "0.784 0.537 0.102 rg 56 672 120 4 re f",
    "0.357 0.392 0.439 rg",
    "BT /F1 10 Tf 1 0 0 1 56 80 Tm (Midad - midad.example) Tj ET",
  ].join("\n");

  const objects: string[] = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    `<< /Length ${Buffer.byteLength(content, "latin1")} >>\nstream\n${content}\nendstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  for (const [index, body] of objects.entries()) {
    offsets.push(Buffer.byteLength(pdf, "latin1"));
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) {
    pdf += `${offset.toString().padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  await writeFile(path, Buffer.from(pdf, "latin1"));

  return { key: `seed/docs/${slug}.pdf`, path };
}

/* ------------------------------------------------------------------ *
 * Upload + cleanup                                                   *
 * ------------------------------------------------------------------ */

export async function readBytes(path: string): Promise<Buffer> {
  return readFile(path);
}

/** Removes the working directory so a repeated seed starts from a clean slate. */
export async function cleanMediaDir(): Promise<void> {
  await rm(SEED_MEDIA_DIR, { recursive: true, force: true });
  await mkdir(SEED_MEDIA_DIR, { recursive: true });
}
