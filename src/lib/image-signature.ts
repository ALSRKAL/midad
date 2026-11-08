/**
 * Image format detection by magic bytes (the product requirements, avatar upload).
 *
 * A browser-supplied MIME type is a claim, not a fact: `File.type` is set by the client and an
 * attacker can post anything. The upload path therefore sniffs the first bytes and accepts only the
 * three formats the crop step produces. Kept pure and dependency-free so it is unit-tested directly.
 */

export type DetectedImageType = { extension: "png" | "jpg" | "webp"; mime: string };

export function detectImageType(bytes: Uint8Array): DetectedImageType | null {
  const startsWith = (signature: number[], offset = 0): boolean =>
    signature.every((byte, index) => bytes[offset + index] === byte);

  if (startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { extension: "png", mime: "image/png" };
  }
  if (startsWith([0xff, 0xd8, 0xff])) {
    return { extension: "jpg", mime: "image/jpeg" };
  }
  const riff = startsWith([0x52, 0x49, 0x46, 0x46]);
  const webp = startsWith([0x57, 0x45, 0x42, 0x50], 8);
  if (riff && webp) {
    return { extension: "webp", mime: "image/webp" };
  }
  return null;
}
