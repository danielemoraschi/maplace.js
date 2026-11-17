import { describe, expect, it } from "vitest";
import { drawHeat, heatPalette } from "./heat-canvas";

/** A canvas `size` pixels square with `points` drawn as heat on it. */
function heated(points: Parameters<typeof drawHeat>[1], size = 64) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (context === null) throw new Error("no 2D context");
  drawHeat(context, points, { radius: 12, intensity: 1, palette: heatPalette(document) });
  return (x: number, y: number) => [...context.getImageData(x, y, 1, 1).data];
}

describe("drawHeat", () => {
  it("colours a point's centre and fades out to nothing", () => {
    const pixel = heated([{ x: 32, y: 32, weight: 1 }]);
    const [, , , centreAlpha = 0] = pixel(32, 32);
    const [, , , edgeAlpha = 0] = pixel(32 + 11, 32);
    expect(centreAlpha).toBeGreaterThan(edgeAlpha);
    expect(pixel(2, 2)).toEqual([0, 0, 0, 0]);
  });

  it("draws a heavier point hotter: further along the colours, from clear", () => {
    const light = heated([{ x: 32, y: 32, weight: 0.2 }])(32, 32);
    const heavy = heated([{ x: 32, y: 32, weight: 1 }])(32, 32);
    expect(heavy[3] ?? 0).toBeGreaterThan(light[3] ?? 0);
  });

  it("adds up points drawn on one another", () => {
    const one = heated([{ x: 32, y: 32, weight: 0.5 }])(32, 32);
    const three = heated([1, 2, 3].map(() => ({ x: 32, y: 32, weight: 0.5 })))(32, 32);
    expect(three).not.toEqual(one);
  });
});

describe("heatPalette", () => {
  it("gives 256 colours, all but clear at no heat, opaque at the most", () => {
    const palette = heatPalette(document);
    expect(palette).toHaveLength(256 * 4);
    expect(palette[3]).toBeLessThan(8);
    expect(palette[255 * 4 + 3]).toBe(255);
  });
});
