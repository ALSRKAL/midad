/**
 * Server-side storage singleton and signed-URL helpers (BR-20).
 *
 * Uploads happen directly from the browser to the bucket with presigned URLs; reads of paid content
 * only ever go through a short-lived signed URL (15 minutes by default), issued after an enrollment
 * check. The core implementation is shared with the seeder (`storage-core.ts`), which cannot import
 * this module because it runs outside the Next runtime.
 */

import "server-only";

import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { env } from "@/env";
import { createStorage, storageConfigFromEnv } from "@/server/storage-core";

export const storage = createStorage(storageConfigFromEnv(env));

/**
 * Signed download URL for a private object. `expiresInSeconds` defaults to the configured TTL and is
 * clamped so a caller cannot accidentally mint a long-lived link to paid content.
 */
export async function signedDownloadUrl(
  key: string,
  expiresInSeconds: number = env.S3_SIGNED_URL_TTL_SEC,
): Promise<string> {
  const ttl = Math.min(Math.max(expiresInSeconds, 60), env.S3_SIGNED_URL_TTL_SEC);

  return getSignedUrl(
    storage.client,
    new GetObjectCommand({ Bucket: storage.buckets.private, Key: key }),
    { expiresIn: ttl },
  );
}

/** Absolute URL of a public asset (covers, thumbnails). Throws for private keys by design. */
export function publicAssetUrl(key: string): string {
  return storage.publicUrl(key);
}

/** Reads a private text object (HLS playlists) for server-side rewriting; never exposed directly. */
export async function getPrivateObjectText(key: string): Promise<string> {
  const response = await storage.client.send(
    new GetObjectCommand({ Bucket: storage.buckets.private, Key: key }),
  );
  if (response.Body === undefined) throw new Error("Object body missing");
  return response.Body.transformToString("utf-8");
}
