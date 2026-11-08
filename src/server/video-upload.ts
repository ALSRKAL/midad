/**
 * Direct-to-S3 video upload (P04-T04, BR-20).
 *
 * The browser receives presigned part URLs for a multipart upload and PUTs the bytes straight to the
 * private bucket; the app never proxies video bytes. The completion step reads the parts back from
 * S3 (ListParts) instead of trusting the browser's ETags, so a manipulated client cannot corrupt the
 * object. A reload can resume: the asset keeps the upload id and S3 lists the parts already present.
 */

import "server-only";

import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  GetObjectCommand,
  ListPartsCommand,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { conflict, notFound, validationFailed } from "@/lib/errors";
import { db } from "@/server/db";
import { storage } from "@/server/storage";

export const PART_SIZE_BYTES = 5 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 2 * 1024 * 1024 * 1024;
const MAX_PARTS = 10_000;
const URL_TTL_SEC = 60 * 60;

const ALLOWED_TYPES: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

async function ownedVideoLesson(
  instructorId: string,
  courseId: string,
  lessonId: string,
): Promise<{ courseStatus: string; lessonId: string }> {
  const lesson = await db.lesson.findFirst({
    where: { id: lessonId, section: { courseId, course: { instructorId } } },
    select: {
      id: true,
      type: true,
      section: { select: { course: { select: { status: true } } } },
    },
  });
  if (lesson === null) throw notFound("Lesson not found");
  if (lesson.type !== "VIDEO") throw conflict("NOT_A_VIDEO_LESSON");
  if (lesson.section.course.status === "PENDING_REVIEW") throw conflict("COURSE_UNDER_REVIEW");
  if (lesson.section.course.status === "ARCHIVED") throw conflict("COURSE_ARCHIVED");
  return { courseStatus: lesson.section.course.status, lessonId: lesson.id };
}

export type VideoUploadSession = {
  uploadId: string;
  key: string;
  partSize: number;
  totalParts: number;
  uploadedParts: number[];
  urls: Array<{ partNumber: number; url: string }>;
};

async function presignMissingParts(
  key: string,
  uploadId: string,
  totalParts: number,
  uploadedParts: number[],
): Promise<Array<{ partNumber: number; url: string }>> {
  const uploaded = new Set(uploadedParts);
  const missing: number[] = [];
  for (let partNumber = 1; partNumber <= totalParts; partNumber += 1) {
    if (!uploaded.has(partNumber)) missing.push(partNumber);
  }

  return Promise.all(
    missing.map(async (partNumber) => ({
      partNumber,
      url: await getSignedUrl(
        storage.client,
        new UploadPartCommand({
          Bucket: storage.buckets.private,
          Key: key,
          UploadId: uploadId,
          PartNumber: partNumber,
        }),
        { expiresIn: URL_TTL_SEC },
      ),
    })),
  );
}

async function listUploadedParts(key: string, uploadId: string): Promise<number[]> {
  const parts: number[] = [];
  let marker: string | undefined;

  for (;;) {
    const page = await storage.client.send(
      new ListPartsCommand({
        Bucket: storage.buckets.private,
        Key: key,
        UploadId: uploadId,
        ...(marker === undefined ? {} : { PartNumberMarker: marker }),
      }),
    );
    for (const part of page.Parts ?? []) {
      if (part.PartNumber !== undefined) parts.push(part.PartNumber);
    }
    if (page.IsTruncated !== true || page.NextPartNumberMarker === undefined) break;
    marker = page.NextPartNumberMarker;
  }

  return parts.sort((a, b) => a - b);
}

export async function startVideoUpload(
  instructorId: string,
  courseId: string,
  lessonId: string,
  input: { fileName: string; sizeBytes: number; contentType: string },
): Promise<VideoUploadSession> {
  await ownedVideoLesson(instructorId, courseId, lessonId);

  if (input.sizeBytes <= 0) throw validationFailed({ file: ["VIDEO_EMPTY"] });
  if (input.sizeBytes > MAX_VIDEO_BYTES) throw validationFailed({ file: ["VIDEO_TOO_LARGE"] });

  const extension = ALLOWED_TYPES[input.contentType];
  if (extension === undefined) throw validationFailed({ file: ["VIDEO_TYPE_INVALID"] });

  const totalParts = Math.ceil(input.sizeBytes / PART_SIZE_BYTES);
  if (totalParts > MAX_PARTS) throw validationFailed({ file: ["VIDEO_TOO_LARGE"] });

  const key = `videos/${courseId}/${lessonId}/${crypto.randomUUID()}.${extension}`;
  const created = await storage.client.send(
    new CreateMultipartUploadCommand({
      Bucket: storage.buckets.private,
      Key: key,
      ContentType: input.contentType,
    }),
  );
  if (created.UploadId === undefined) {
    throw conflict("UPLOAD_START_FAILED");
  }

  await db.videoAsset.upsert({
    where: { lessonId },
    create: {
      lessonId,
      originalKey: key,
      uploadId: created.UploadId,
      status: "UPLOADING",
      sizeBytes: BigInt(input.sizeBytes),
    },
    update: {
      originalKey: key,
      uploadId: created.UploadId,
      status: "UPLOADING",
      hlsKey: null,
      thumbnailKey: null,
      durationSec: 0,
      errorMessage: null,
      processedAt: null,
      sizeBytes: BigInt(input.sizeBytes),
    },
  });

  const urls = await presignMissingParts(key, created.UploadId, totalParts, []);
  return {
    uploadId: created.UploadId,
    key,
    partSize: PART_SIZE_BYTES,
    totalParts,
    uploadedParts: [],
    urls,
  };
}

/**
 * Resumes an interrupted upload. S3 is the authority on which parts landed; only the missing ones
 * get a fresh URL. An expired/aborted multipart is reported as UPLOAD_EXPIRED instead of hanging.
 */
export async function resumeVideoUpload(
  instructorId: string,
  courseId: string,
  lessonId: string,
): Promise<VideoUploadSession> {
  await ownedVideoLesson(instructorId, courseId, lessonId);

  const asset = await db.videoAsset.findUnique({
    where: { lessonId },
    select: { originalKey: true, uploadId: true, sizeBytes: true, status: true },
  });
  if (asset === null || asset.uploadId === null || asset.sizeBytes === null) {
    throw conflict("NO_UPLOAD_TO_RESUME");
  }
  if (asset.status !== "UPLOADING") throw conflict("UPLOAD_ALREADY_FINISHED");

  const totalParts = Math.ceil(Number(asset.sizeBytes) / PART_SIZE_BYTES);

  let uploadedParts: number[];
  try {
    uploadedParts = await listUploadedParts(asset.originalKey, asset.uploadId);
  } catch {
    throw conflict("UPLOAD_EXPIRED");
  }

  const urls = await presignMissingParts(
    asset.originalKey,
    asset.uploadId,
    totalParts,
    uploadedParts,
  );
  return {
    uploadId: asset.uploadId,
    key: asset.originalKey,
    partSize: PART_SIZE_BYTES,
    totalParts,
    uploadedParts,
    urls,
  };
}

/** Completes with S3's own part list, then hands the asset to the HLS worker. */
export async function completeVideoUpload(
  instructorId: string,
  courseId: string,
  lessonId: string,
): Promise<{ status: "PROCESSING" }> {
  await ownedVideoLesson(instructorId, courseId, lessonId);

  const asset = await db.videoAsset.findUnique({
    where: { lessonId },
    select: { originalKey: true, uploadId: true, status: true },
  });
  if (asset === null || asset.uploadId === null) throw conflict("NO_UPLOAD_TO_RESUME");
  if (asset.status !== "UPLOADING") throw conflict("UPLOAD_ALREADY_FINISHED");

  const uploadedParts: Array<{ ETag: string; PartNumber: number }> = [];
  let marker: string | undefined;
  for (;;) {
    const page = await storage.client.send(
      new ListPartsCommand({
        Bucket: storage.buckets.private,
        Key: asset.originalKey,
        UploadId: asset.uploadId,
        ...(marker === undefined ? {} : { PartNumberMarker: marker }),
      }),
    );
    for (const part of page.Parts ?? []) {
      if (part.PartNumber !== undefined && part.ETag !== undefined) {
        uploadedParts.push({ ETag: part.ETag, PartNumber: part.PartNumber });
      }
    }
    if (page.IsTruncated !== true || page.NextPartNumberMarker === undefined) break;
    marker = page.NextPartNumberMarker;
  }

  if (uploadedParts.length === 0) throw conflict("UPLOAD_EMPTY");

  await storage.client.send(
    new CompleteMultipartUploadCommand({
      Bucket: storage.buckets.private,
      Key: asset.originalKey,
      UploadId: asset.uploadId,
      MultipartUpload: {
        Parts: uploadedParts.sort((a, b) => a.PartNumber - b.PartNumber),
      },
    }),
  );

  await db.videoAsset.update({
    where: { lessonId },
    data: { status: "PROCESSING", uploadId: null, errorMessage: null },
  });

  return { status: "PROCESSING" };
}

export async function abortVideoUpload(
  instructorId: string,
  courseId: string,
  lessonId: string,
): Promise<void> {
  await ownedVideoLesson(instructorId, courseId, lessonId);

  const asset = await db.videoAsset.findUnique({
    where: { lessonId },
    select: { originalKey: true, uploadId: true },
  });
  if (asset === null || asset.uploadId === null) return;

  await storage.client
    .send(
      new AbortMultipartUploadCommand({
        Bucket: storage.buckets.private,
        Key: asset.originalKey,
        UploadId: asset.uploadId,
      }),
    )
    .catch(() => undefined);

  await db.videoAsset.update({
    where: { lessonId },
    data: { status: "FAILED", uploadId: null, errorMessage: "UPLOAD_CANCELLED" },
  });
}

export type VideoStatus = {
  status: "UPLOADING" | "PROCESSING" | "READY" | "FAILED" | null;
  durationSec: number;
  errorMessage: string | null;
  canResume: boolean;
};

export async function getVideoStatus(
  instructorId: string,
  courseId: string,
  lessonId: string,
): Promise<VideoStatus> {
  await ownedVideoLesson(instructorId, courseId, lessonId);
  const asset = await db.videoAsset.findUnique({
    where: { lessonId },
    select: { status: true, durationSec: true, errorMessage: true, uploadId: true },
  });
  if (asset === null) {
    return { status: null, durationSec: 0, errorMessage: null, canResume: false };
  }
  return {
    status: asset.status,
    durationSec: asset.durationSec,
    errorMessage: asset.errorMessage,
    canResume: asset.status === "UPLOADING" && asset.uploadId !== null,
  };
}

/** Signed playback URL for the source object; the HLS playlist is served through the player later. */
export async function signedVideoDownload(key: string): Promise<string> {
  return getSignedUrl(
    storage.client,
    new GetObjectCommand({ Bucket: storage.buckets.private, Key: key }),
    { expiresIn: 15 * 60 },
  );
}
