import { describe, expect, it } from "vitest";
import {
  DEFAULT_SCENE_HEIGHT,
  type SceneHeight,
  SHARING,
  SHOT_SIZES,
  sceneOf,
  THUMBNAIL,
} from "./shot-sizes.ts";

describe("sceneOf", () => {
  it("makes the default 672×420 scene a 640×400 thumbnail", () => {
    const { viewport, deviceScaleFactor } = sceneOf(DEFAULT_SCENE_HEIGHT, THUMBNAIL);
    expect(viewport).toEqual({ width: 672, height: 420 });
    expect(viewport.width * deviceScaleFactor).toBeCloseTo(640, 9);
    expect(viewport.height * deviceScaleFactor).toBeCloseTo(400, 9);
  });

  it("keeps the scene's height for the sharing image, widened to 1200×630", () => {
    expect(sceneOf(DEFAULT_SCENE_HEIGHT, SHARING)).toEqual({
      viewport: { width: 800, height: 420 },
      deviceScaleFactor: 1.5,
    });
  });

  it("gives every scene height whole CSS pixels and exact images at both sizes", () => {
    for (const height of [315, 420, 525, 630] satisfies SceneHeight[]) {
      for (const size of SHOT_SIZES) {
        const { viewport, deviceScaleFactor } = sceneOf(height, size);
        expect(Number.isInteger(viewport.width), `${height} ${size.folder}`).toBe(true);
        expect(viewport.width * deviceScaleFactor).toBeCloseTo(size.width, 9);
        expect(viewport.height * deviceScaleFactor).toBeCloseTo(size.height, 9);
      }
    }
  });
});
