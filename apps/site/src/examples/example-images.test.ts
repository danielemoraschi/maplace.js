import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { jpegSize } from "../../../../scripts/build/jpeg-size.ts";
import { SHOT_SIZES, SHOTS } from "../../../../scripts/example-shots/shot-sizes.ts";
import { sharingImageOf, thumbnailOf } from "./example-images.ts";
import { EXAMPLE_SECTIONS } from "./example-sections.ts";

/** A folder's pictures, as the site's globs find them: anything else (a `.DS_Store`) left out. */
const filesIn = (folder: string) =>
  readdirSync(join(SHOTS, folder)).filter((file) => file.endsWith(".jpg"));

describe("the examples' pictures", () => {
  it("give every example a thumbnail and a sharing image, the sharing image's alt naming it", () => {
    for (const section of EXAMPLE_SECTIONS) {
      // Vitest resolves an image to its URL, not Astro's metadata: present is all it can say.
      expect(thumbnailOf(section), section.name).toBeDefined();
      expect(sharingImageOf(section)?.alt, section.name).toBe(`${section.title} on a MapLibre map`);
    }
  });

  it("hold every thumbnail to 640×400 and every sharing image to 1200×630", () => {
    for (const { folder, width, height } of SHOT_SIZES) {
      for (const file of filesIn(folder)) {
        const size = jpegSize(readFileSync(join(SHOTS, folder, file)));
        expect(size, `${folder}/${file}`).toEqual({ width, height });
      }
    }
  });

  it("have no picture of an example that isn't there", () => {
    const files = EXAMPLE_SECTIONS.map(({ name }) => `${name}.jpg`).sort();
    for (const { folder } of SHOT_SIZES) expect(filesIn(folder).sort(), folder).toEqual(files);
  });
});
