// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { sizeTakenIn } from "./map-size";

/**
 * A map whose container is `container` CSS pixels, its canvas laid out at `canvas` CSS pixels
 * (MapLibre's `round(ratio × size) / ratio`) and drawn at `ratio` device pixels per CSS pixel.
 */
function mapOf(container: [number, number], canvas: [number, number], ratio = 1) {
  const element = { clientWidth: container[0], clientHeight: container[1] } as HTMLElement;
  const drawn = {
    width: Math.round(canvas[0] * ratio),
    height: Math.round(canvas[1] * ratio),
    style: { width: `${canvas[0]}px`, height: `${canvas[1]}px` },
  } as HTMLCanvasElement;
  return { getContainer: () => element, getCanvas: () => drawn } as never;
}

describe("sizeTakenIn", () => {
  it("takes a canvas the container's size as taken in, and one MapLibre hasn't resized as not", () => {
    expect(sizeTakenIn(mapOf([512, 512], [512, 512]))).toBe(true);
    expect(sizeTakenIn(mapOf([512, 512], [400, 300]))).toBe(false);
  });

  it("allows MapLibre's rounding to whole device pixels below a pixel ratio of 1", () => {
    // At 0.5, a 401px container gets a canvas of round(200.5) / 0.5 = 402px.
    expect(sizeTakenIn(mapOf([401, 300], [402, 300], 0.5))).toBe(true);
    // At 0.9, a 405px container gets round(364.5) / 0.9 = 405.56px, which its clientWidth rounds up.
    expect(sizeTakenIn(mapOf([405, 300], [365 / 0.9, 300], 0.9))).toBe(true);
    expect(sizeTakenIn(mapOf([401, 300], [402, 300], 1))).toBe(false);
  });
});
