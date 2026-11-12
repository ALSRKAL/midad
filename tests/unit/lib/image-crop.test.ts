import { describe, expect, it } from "vitest";

import { computeCropRect } from "@/lib/image-crop";

/**
 * Square-crop geometry for the avatar dialog (P02-T05).
 *
 * The important properties are: the square never leaves the image, the pan reaches both edges but
 * never past them, and zoom can only shrink the square (1 = the whole short side).
 */

describe("computeCropRect", () => {
  it("uses the full short side of a square image at zoom 1", () => {
    expect(computeCropRect({ imageWidth: 800, imageHeight: 800 })).toEqual({
      sx: 0,
      sy: 0,
      size: 800,
    });
  });

  it("centres the square on a landscape image", () => {
    expect(computeCropRect({ imageWidth: 1200, imageHeight: 800 })).toEqual({
      sx: 200,
      sy: 0,
      size: 800,
    });
  });

  it("centres the square on a portrait image", () => {
    expect(computeCropRect({ imageWidth: 800, imageHeight: 1200 })).toEqual({
      sx: 0,
      sy: 200,
      size: 800,
    });
  });

  it("halves the source square at zoom 2", () => {
    expect(computeCropRect({ imageWidth: 800, imageHeight: 800, zoom: 2 })).toEqual({
      sx: 200,
      sy: 200,
      size: 400,
    });
  });

  it("pans to both horizontal edges and stops there", () => {
    const right = computeCropRect({ imageWidth: 1200, imageHeight: 800, panX: 1 });
    expect(right.sx).toBe(400);
    expect(right.sx + right.size).toBe(1200);

    const left = computeCropRect({ imageWidth: 1200, imageHeight: 800, panX: -1 });
    expect(left.sx).toBe(0);
  });

  it("pans vertically as well", () => {
    const bottom = computeCropRect({ imageWidth: 800, imageHeight: 1200, panY: 1 });
    expect(bottom.sy).toBe(400);
    expect(bottom.sy + bottom.size).toBe(1200);
  });

  it("clamps zoom outside the supported range", () => {
    expect(computeCropRect({ imageWidth: 800, imageHeight: 800, zoom: 0 }).size).toBe(800);
    expect(computeCropRect({ imageWidth: 800, imageHeight: 800, zoom: 99 }).size).toBe(200);
  });

  it("clamps pan outside [-1, 1]", () => {
    expect(computeCropRect({ imageWidth: 1200, imageHeight: 800, panX: 12 }).sx).toBe(400);
    expect(computeCropRect({ imageWidth: 1200, imageHeight: 800, panX: -12 }).sx).toBe(0);
  });

  it("treats a missing or non-finite value as the neutral default", () => {
    expect(
      computeCropRect({
        imageWidth: 800,
        imageHeight: 800,
        zoom: Number.NaN,
        panX: Number.NaN,
        panY: Number.POSITIVE_INFINITY,
      }),
    ).toEqual({ sx: 0, sy: 0, size: 800 });
  });

  it("still returns a valid square for a 1×1 image", () => {
    expect(computeCropRect({ imageWidth: 1, imageHeight: 1 })).toEqual({
      sx: 0,
      sy: 0,
      size: 1,
    });
  });

  it("rejects impossible dimensions instead of producing NaN", () => {
    expect(() => computeCropRect({ imageWidth: 0, imageHeight: 100 })).toThrow();
    expect(() => computeCropRect({ imageWidth: -5, imageHeight: 100 })).toThrow();
    expect(() => computeCropRect({ imageWidth: Number.NaN, imageHeight: 100 })).toThrow();
  });
});
