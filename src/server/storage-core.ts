/**
 * S3-compatible object storage, core layer.
 *
 * This module is deliberately **configuration-injected and side-effect free**: the application
 * builds one instance from `@/env` (see `src/server/storage.ts`, added in P01-T07) and command-line
 * tooling such as the seeder builds its own from its validated environment. Both share this code
 * instead of duplicating it.
 *
 * Two buckets exist (ADR-0011):
 *   public   — course covers, thumbnails: anonymous read, served through next/image.
 *   private  — videos, attachments, invoices: never public, only short-lived signed URLs (BR-20).
 */

import {
  CreateBucketCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

export type StorageBuckets = {
  public: string;
  private: string;
};

export type StorageConfig = {
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  /** MinIO and most self-hosted gateways require path-style addressing. */
  forcePathStyle: boolean;
  /** Public base URL for objects in the public bucket, e.g. http://localhost:9000/midad-public. */
  publicBaseUrl: string;
  buckets: StorageBuckets;
};

export type PutObjectInput = {
  bucket: "public" | "private";
  key: string;
  body: Uint8Array | Buffer;
  contentType: string;
  /** Long-lived caching is safe because keys are content-addressed by convention (checksum/ULID). */
  cacheControl?: string;
};

export type Storage = {
  client: S3Client;
  buckets: StorageBuckets;
  putObject: (input: PutObjectInput) => Promise<void>;
  /** Removes an object; used when a replaced avatar would otherwise be orphaned. */
  deleteObject: (bucket: PutObjectInput["bucket"], key: string) => Promise<void>;
  /** Absolute URL of an object in the public bucket (throws for the private bucket). */
  publicUrl: (key: string) => string;
  /** Verifies a bucket exists; used by the seeder before the first upload. */
  bucketExists: (name: string) => Promise<boolean>;
  /** Creates a bucket if it does not exist. Idempotent. */
  ensureBucket: (name: string) => Promise<void>;
};

export function createStorage(config: StorageConfig): Storage {
  const client = new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle: config.forcePathStyle,
  });

  const bucketName = (bucket: PutObjectInput["bucket"]) => config.buckets[bucket];

  return {
    client,
    buckets: config.buckets,

    async putObject({ bucket, key, body, contentType, cacheControl }) {
      await client.send(
        new PutObjectCommand({
          Bucket: bucketName(bucket),
          Key: key,
          Body: body,
          ContentType: contentType,
          ...(cacheControl === undefined ? {} : { CacheControl: cacheControl }),
        }),
      );
    },

    async deleteObject(bucket, key) {
      await client.send(new DeleteObjectCommand({ Bucket: bucketName(bucket), Key: key }));
    },

    publicUrl(key) {
      return `${config.publicBaseUrl.replace(/\/$/, "")}/${key.replace(/^\//, "")}`;
    },

    async bucketExists(name) {
      try {
        await client.send(new HeadBucketCommand({ Bucket: name }));
        return true;
      } catch {
        return false;
      }
    },

    async ensureBucket(name) {
      if (await this.bucketExists(name)) return;
      await client.send(new CreateBucketCommand({ Bucket: name }));
    },
  };
}

/** Builds a storage instance from a parsed server environment (works in the app and in CLI tools). */
export function storageConfigFromEnv(env: {
  S3_ENDPOINT: string;
  S3_REGION: string;
  S3_ACCESS_KEY_ID: string;
  S3_SECRET_ACCESS_KEY: string;
  S3_FORCE_PATH_STYLE: boolean;
  S3_BUCKET_PUBLIC: string;
  S3_BUCKET_PRIVATE: string;
}): StorageConfig {
  return {
    endpoint: env.S3_ENDPOINT,
    region: env.S3_REGION,
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    forcePathStyle: env.S3_FORCE_PATH_STYLE,
    publicBaseUrl: `${env.S3_ENDPOINT.replace(/\/$/, "")}/${env.S3_BUCKET_PUBLIC}`,
    buckets: {
      public: env.S3_BUCKET_PUBLIC,
      private: env.S3_BUCKET_PRIVATE,
    },
  };
}
