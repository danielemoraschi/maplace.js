import type { Metafile } from "esbuild";
import { describe, expect, it } from "vitest";
import { bundledPackages } from "./third-party-licenses.ts";

const input = { bytes: 0, imports: [] };

describe("bundledPackages", () => {
  it("names each package a bundle took code from once, scoped and nested ones too", () => {
    const metafile: Metafile = {
      outputs: {},
      inputs: {
        "packages/maplace/src/index.ts": input,
        "node_modules/@googlemaps/markerclusterer/dist/index.esm.mjs": input,
        "node_modules/supercluster/index.js": input,
        "node_modules/supercluster/node_modules/kdbush/index.js": input,
        "node_modules/kdbush/index.js": input,
        "node_modules/kdbush/lib/other.js": input,
      },
    };
    expect(bundledPackages([metafile])).toEqual([
      "node_modules/@googlemaps/markerclusterer",
      "node_modules/kdbush",
      "node_modules/supercluster",
      "node_modules/supercluster/node_modules/kdbush",
    ]);
  });
});
