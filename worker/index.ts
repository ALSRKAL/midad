/**
 * HLS worker (P04-T04).
 *
 * Polls video assets in PROCESSING, downloads the uploaded original from the private bucket, runs
 * ffmpeg to produce a 720p HLS playlist plus a thumbnail, uploads the results, then marks the asset
 * READY and updates the lesson and course durations.
 *
 * It is a separate process on purpose: transcoding is CPU-heavy and must never run inside a request
 * or a server action. Run it with `pnpm worker`; the Playwright stack starts it automatically.
 */

import { spawn } from "node:child_process";
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { PrismaPg } from "@prisma/adapter-pg";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import nodemailer from "nodemailer";

import { generateCertificatePdf } from "../src/lib/certificate-pdf";
import { renderEmail, type EmailTemplate } from "../src/lib/email-templates";

import { PrismaClient } from "../src/generated/prisma/client";
import { createStorage, storageConfigFromEnv } from "../src/server/storage-core";

const POLL_MS = 2000;

const mailer = nodemailer.createTransport({
  host: env("SMTP_HOST"),
  port: Number(env("SMTP_PORT")),
  secure: process.env.SMTP_SECURE === "true",
  ...(process.env.SMTP_USER === undefined || process.env.SMTP_USER === ""
    ? {}
    : {
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD ?? "",
        },
      }),
});

function env(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable ${name}`);
  }
  return value;
}

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: env("DATABASE_URL") }),
});

const storage = createStorage(
  storageConfigFromEnv({
    S3_ENDPOINT: env("S3_ENDPOINT"),
    S3_REGION: env("S3_REGION"),
    S3_ACCESS_KEY_ID: env("S3_ACCESS_KEY_ID"),
    S3_SECRET_ACCESS_KEY: env("S3_SECRET_ACCESS_KEY"),
    S3_FORCE_PATH_STYLE: env("S3_FORCE_PATH_STYLE") === "true",
    S3_BUCKET_PUBLIC: env("S3_BUCKET_PUBLIC"),
    S3_BUCKET_PRIVATE: env("S3_BUCKET_PRIVATE"),
  }),
);

function run(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk: Buffer) => {
      stderr = `${stderr}${chunk.toString()}`.slice(-4000);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with ${code}: ${stderr}`));
    });
  });
}

async function probeDuration(file: string): Promise<number> {
  const value = await new Promise<string>((resolve, reject) => {
    const child = spawn("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      file,
    ]);
    let output = "";
    child.stdout.on("data", (chunk: Buffer) => {
      output += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve(output.trim());
      else reject(new Error(`ffprobe exited with ${code}`));
    });
  });

  const seconds = Number.parseFloat(value);
  return Number.isFinite(seconds) && seconds > 0 ? Math.round(seconds) : 0;
}

function contentTypeFor(file: string): string {
  if (file.endsWith(".m3u8")) return "application/vnd.apple.mpegurl";
  if (file.endsWith(".ts")) return "video/mp2t";
  if (file.endsWith(".jpg") || file.endsWith(".jpeg")) return "image/jpeg";
  return "application/octet-stream";
}

async function uploadDirectory(localDir: string, prefix: string): Promise<void> {
  const files = await readdir(localDir);
  for (const file of files) {
    const bytes = await readFile(join(localDir, file));
    await storage.putObject({
      bucket: "private",
      key: `${prefix}/${file}`,
      body: bytes,
      contentType: contentTypeFor(file),
      cacheControl: "private, max-age=31536000, immutable",
    });
  }
}

async function processAsset(assetId: string): Promise<void> {
  const asset = await db.videoAsset.findUnique({
    where: { id: assetId },
    select: {
      id: true,
      originalKey: true,
      lessonId: true,
      lesson: { select: { section: { select: { courseId: true } } } },
    },
  });
  if (asset === null) return;

  const workDir = await mkdtemp(join(tmpdir(), "midad-hls-"));

  try {
    const object = await storage.client.send(
      new GetObjectCommand({ Bucket: storage.buckets.private, Key: asset.originalKey }),
    );
    if (object.Body === undefined) throw new Error("Original object has no body");
    const bytes = await object.Body.transformToByteArray();

    const input = join(workDir, "input");
    await writeFile(input, bytes);

    const durationSec = await probeDuration(input);
    const hlsDir = join(workDir, "hls");
    await mkdir(hlsDir);

    await run("ffmpeg", [
      "-y",
      "-i",
      input,
      "-vf",
      "scale=-2:720",
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "23",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-hls_time",
      "4",
      "-hls_playlist_type",
      "vod",
      "-hls_segment_filename",
      join(hlsDir, "segment_%03d.ts"),
      join(hlsDir, "index.m3u8"),
    ]);

    let thumbnailKey: string | null = null;
    try {
      const thumbnail = join(workDir, "thumb.jpg");
      await run("ffmpeg", [
        "-y",
        "-ss",
        "0.5",
        "-i",
        input,
        "-frames:v",
        "1",
        "-vf",
        "scale=640:-2",
        thumbnail,
      ]);
      thumbnailKey = `hls/${asset.id}/thumb.jpg`;
      await storage.putObject({
        bucket: "private",
        key: thumbnailKey,
        body: await readFile(thumbnail),
        contentType: "image/jpeg",
        cacheControl: "private, max-age=31536000, immutable",
      });
    } catch {
      // A missing thumbnail must not fail playback.
      thumbnailKey = null;
    }

    const prefix = `hls/${asset.id}`;
    await uploadDirectory(hlsDir, prefix);

    await db.$transaction([
      db.videoAsset.update({
        where: { id: asset.id },
        data: {
          status: "READY",
          hlsKey: `${prefix}/index.m3u8`,
          thumbnailKey,
          durationSec,
          errorMessage: null,
          processedAt: new Date(),
        },
      }),
      db.lesson.update({
        where: { id: asset.lessonId },
        data: { durationSec },
      }),
    ]);

    const courseId = asset.lesson.section.courseId;
    const total = await db.lesson.aggregate({
      where: { section: { courseId } },
      _sum: { durationSec: true },
    });
    await db.course.update({
      where: { id: courseId },
      data: { totalDurationSec: total._sum.durationSec ?? 0 },
    });

    console.log(`[worker] ready asset ${asset.id} (${durationSec}s)`);
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

async function processCertificate(certificateId: string): Promise<void> {
  const certificate = await db.certificate.findUnique({
    where: { id: certificateId },
    select: {
      id: true,
      code: true,
      issuedAt: true,
      recipientName: true,
      course: {
        select: {
          titleAr: true,
          titleEn: true,
          instructor: { select: { user: { select: { name: true } } } },
        },
      },
    },
  });
  if (certificate === null) return;

  const bytes = await generateCertificatePdf({
    code: certificate.code,
    recipientName: certificate.recipientName,
    courseTitleAr: certificate.course.titleAr,
    courseTitleEn: certificate.course.titleEn,
    issuedAt: certificate.issuedAt,
    instructorName: certificate.course.instructor.user.name,
    verifyUrl: `${env("APP_URL")}/ar/verify/${certificate.code}`,
  });
  const key = `certificates/${certificate.code}.pdf`;
  await storage.putObject({
    bucket: "private",
    key,
    body: bytes,
    contentType: "application/pdf",
    cacheControl: "private, max-age=31536000, immutable",
  });
  await db.certificate.update({
    where: { id: certificate.id },
    data: { pdfKey: key },
  });
  console.log(`[worker] certificate ${certificate.code} generated`);
}

async function processEmail(jobId: string): Promise<void> {
  const job = await db.emailJob.findUnique({
    where: { id: jobId },
    select: { id: true, to: true, template: true, locale: true, data: true, attempts: true },
  });
  if (job === null) return;
  const rendered = renderEmail(
    job.template as EmailTemplate,
    job.locale === "en" ? "en" : "ar",
    (job.data ?? {}) as Record<string, unknown>,
  );
  try {
    await mailer.sendMail({
      from: env("AUTH_EMAIL_FROM"),
      to: job.to,
      subject: rendered.subject,
      text: rendered.text,
      html: rendered.html,
    });
    await db.emailJob.update({
      where: { id: job.id },
      data: { status: "SENT", sentAt: new Date(), lastError: null },
    });
    console.log(`[worker] email ${job.template} -> ${job.to}`);
  } catch (error) {
    const attempts = job.attempts + 1;
    await db.emailJob.update({
      where: { id: job.id },
      data: {
        attempts,
        status: attempts >= 5 ? "FAILED" : "PENDING",
        lastError: "SEND_FAILED",
      },
    });
    console.error(`[worker] email ${job.id} failed`, error);
  }
}

let stopping = false;

async function main(): Promise<void> {
  console.log("[worker] HLS worker started");
  process.on("SIGINT", () => {
    stopping = true;
  });
  process.on("SIGTERM", () => {
    stopping = true;
  });

  while (!stopping) {
    const asset = await db.videoAsset.findFirst({
      where: { status: "PROCESSING" },
      orderBy: { updatedAt: "asc" },
      select: { id: true },
    });

    if (asset === null) {
      const email = await db.emailJob.findFirst({
        where: { status: "PENDING", attempts: { lt: 5 } },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });
      if (email !== null) {
        await processEmail(email.id);
        continue;
      }
      const certificate = await db.certificate.findFirst({
        where: { status: "ISSUED", pdfKey: null },
        orderBy: { issuedAt: "asc" },
        select: { id: true },
      });
      if (certificate !== null) {
        try {
          await processCertificate(certificate.id);
        } catch (error) {
          console.error(`[worker] certificate ${certificate.id} failed`, error);
          await new Promise((resolve) => setTimeout(resolve, POLL_MS));
        }
        continue;
      }
      await new Promise((resolve) => setTimeout(resolve, POLL_MS));
      continue;
    }

    try {
      await processAsset(asset.id);
    } catch (error) {
      console.error(`[worker] asset ${asset.id} failed`, error);
      await db.videoAsset.update({
        where: { id: asset.id },
        data: {
          status: "FAILED",
          // Never store raw ffmpeg output: it can contain local paths.
          errorMessage: "PROCESSING_FAILED",
        },
      });
    }
  }

  console.log("[worker] stopped");
  await db.$disconnect();
}

main().catch((error: unknown) => {
  console.error("[worker] fatal", error);
  process.exitCode = 1;
});
