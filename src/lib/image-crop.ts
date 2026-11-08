/**
 * Square avatar crop geometry (the product requirements: "الصورة (رفع + قص)").
 *
 * The browser draws the selected square from the source image onto a 512×512 canvas; this module
 * decides *which* square. It is pure arithmetic, so the edge cases (pan to the boundary, maximum
 * zoom, a 1-pixel image) are unit-tested without a DOM.
 *
 * Coordinates are source pixels. `panX`/`panY` are normalised to [-1, 1] and clamp at the image
 * edge, which is what the drag interaction and the position sliders feed in.
 */

export const MIN_AVATAR_ZOOM = 1;
export const MAX_AVATAR_ZOOM = 4;
export const AVATAR_OUTPUT_SIZE = 512;

export type CropRect = {
  /** Left edge of the square in source pixels. */
  sx: number;
  /** Top edge of the square in source pixels. */
  sy: number;
  /** Side length of the square in source pixels. */
  size: number;
};

export type CropInput = {
  imageWidth: number;
  imageHeight: number;
  zoom?: number;
  panX?: number;
  panY?: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function computeCropRect({
  imageWidth,
  imageHeight,
  zoom = MIN_AVATAR_ZOOM,
  panX = 0,
  panY = 0,
}: CropInput): CropRect {
  if (!Number.isFinite(imageWidth) || !Number.isFinite(imageHeight)) {
    throw new Error("Image dimensions must be finite numbers");
  }
  if (imageWidth < 1 || imageHeight < 1) {
    throw new Error("Image dimensions must be positive");
  }

  const safeZoom = clamp(
    Number.isFinite(zoom) ? zoom : MIN_AVATAR_ZOOM,
    MIN_AVATAR_ZOOM,
    MAX_AVATAR_ZOOM,
  );
  const base = Math.min(imageWidth, imageHeight);
  const size = Math.max(1, Math.round(base / safeZoom));

  const slackX = imageWidth - size;
  const slackY = imageHeight - size;
  const safePanX = clamp(Number.isFinite(panX) ? panX : 0, -1, 1);
  const safePanY = clamp(Number.isFinite(panY) ? panY : 0, -1, 1);

  return {
    sx: Math.round(clamp(slackX / 2 + (safePanX * slackX) / 2, 0, slackX)),
    sy: Math.round(clamp(slackY / 2 + (safePanY * slackY) / 2, 0, slackY)),
    size,
  };
}
