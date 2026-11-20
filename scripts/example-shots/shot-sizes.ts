import { join } from "node:path";
import { OG_IMAGE } from "../../apps/site/src/site/head-meta-tags.ts";
import { ROOT } from "../build/package.ts";

/** Where the site keeps every example's pictures, a folder for each size. */
export const SHOTS = join(ROOT, "apps/site/src/assets/shots");

/** An image every example is captured as: its folder, its size in pixels, and whether it carries the map's credit. */
export interface ShotSize {
  readonly folder: "thumbnails" | "sharing";
  readonly width: number;
  readonly height: number;
  /** Seen off the site, where no page credits the map's data beside it (W65). */
  readonly showsCredit: boolean;
}

/** The thumbnail the examples' lists show. */
export const THUMBNAIL: ShotSize = {
  folder: "thumbnails",
  width: 640,
  height: 400,
  showsCredit: false,
};

/** An example page's sharing image, the site's own image's size. */
export const SHARING: ShotSize = {
  folder: "sharing",
  width: OG_IMAGE.width,
  height: OG_IMAGE.height,
  showsCredit: true,
};

/** Every image of an example, the thumbnail first: the sharing image takes its view. */
export const SHOT_SIZES: readonly ShotSize[] = [THUMBNAIL, SHARING];

/**
 * A scene's height in CSS pixels: a multiple of 105, so its thumbnail's width (1.6 times it) and
 * its sharing image's (40/21 times it) are whole pixels, and so are both images.
 */
export type SceneHeight = 420 | 525 | 630;

export const DEFAULT_SCENE_HEIGHT: SceneHeight = 420;

/**
 * The viewport and scale that draw a scene `height` tall as `size`: the same height for every
 * size, so the subject is the same size in each, the width following the image's shape.
 */
export function sceneOf(height: SceneHeight, size: ShotSize) {
  return {
    viewport: { width: (height * size.width) / size.height, height },
    deviceScaleFactor: size.height / height,
  };
}
