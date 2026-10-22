import { describe, expect, it } from "vitest";
import { needsRealMaps } from "./real-maps.ts";

describe("needsRealMaps", () => {
  it("runs Google's real maps for a change to the package, an example, the site or the setup", () => {
    for (const path of [
      "packages/maplace/src/google/marker.ts",
      "packages/maplace/src/store.ts",
      "packages/maplace/src/element/element.ts",
      "packages/maplace/examples/route/vanilla.ts",
      "apps/site/src/scripts/site.ts",
      "apps/site/test/examples-on-google.test.ts",
      "package-lock.json",
      ".github/workflows/ci.yml",
    ]) {
      expect(needsRealMaps([path]), path).toBe(true);
    }
  });

  it("skips them for docs and MapLibre-only files, which no real-Maps test reads", () => {
    expect(
      needsRealMaps([
        "docs/MODERNIZE.md",
        "README.md",
        "packages/maplace/examples/custom-list/guide.md",
        "packages/maplace/src/maplibre/layers.ts",
        "packages/maplace/src/element/maplibre.ts",
        "packages/maplace/examples/simple/maplibre/vanilla.ts",
        "apps/site/test/examples-on-maplibre.test.ts",
        "apps/site/src/scripts/maplibre-assets.ts",
      ]),
    ).toBe(false);
  });

  it("runs them when one change among the skipped ones matters", () => {
    expect(needsRealMaps(["docs/MODERNIZE.md", "packages/maplace/src/google/popup.ts"])).toBe(true);
  });

  it("runs them when the changes can't be told, as with no run passed yet or a rewritten history", () => {
    expect(needsRealMaps(undefined)).toBe(true);
  });
});
