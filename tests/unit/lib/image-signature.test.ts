import { describe, expect, it } from "vitest";

import { detectImageType } from "@/lib/image-signature";

/**
 * Magic-byte detection for avatar uploads (P02-T05).
 *
 * A declared MIME type must never be trusted; these tests pin the accept/reject boundary, including
 * the WebP case where the signature starts at byte 8.
 */

const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46]);
const webp = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38,
]);

describe("detectImageType", () => {
  it("recognises PNG", () => {
    expect(detectImageType(png)).toEqual({ extension: "png", mime: "image/png" });
  });

  it("recognises JPEG", () => {
    expect(detectImageType(jpeg)).toEqual({ extension: "jpg", mime: "image/jpeg" });
  });

  it("recognises WebP by the RIFF/WEBP pair, not by RIFF alone", () => {
    expect(detectImageType(webp)).toEqual({ extension: "webp", mime: "image/webp" });
  });

  it("rejects RIFF files that are not WebP", () => {
    const wav = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x41, 0x56, 0x45]);
    expect(detectImageType(wav)).toBeNull();
  });

  it("rejects SVG, HTML and plain text", () => {
    const svg = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
    const html = new TextEncoder().encode("<html><script>alert(1)</script></html>");
    expect(detectImageType(svg)).toBeNull();
    expect(detectImageType(html)).toBeNull();
    expect(detectImageType(new TextEncoder().encode("hello"))).toBeNull();
  });

  it("rejects a truncated signature", () => {
    expect(detectImageType(new Uint8Array([0x89, 0x50]))).toBeNull();
    expect(detectImageType(new Uint8Array([]))).toBeNull();
  });
});
