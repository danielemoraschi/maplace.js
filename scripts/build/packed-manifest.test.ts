import { describe, expect, it } from "vitest";
import { packedManifest } from "./packed-manifest.ts";

const MANIFEST = {
  name: "maplace",
  files: ["dist"],
  sideEffects: ["./dist/element/index.js", "./src/element/index.ts"],
  exports: {
    ".": {
      "maplace:source": "./src/index.ts",
      types: "./dist/index.d.ts",
      default: "./dist/index.js",
    },
    "./testing": { "maplace:source": "./src/testing/index.ts" },
    "./package.json": "./package.json",
  },
};

describe("packedManifest", () => {
  it("drops the source condition, and the exports only it served", () => {
    expect(packedManifest(MANIFEST).exports).toEqual({
      ".": { types: "./dist/index.d.ts", default: "./dist/index.js" },
      "./package.json": "./package.json",
    });
  });

  it("keeps the conditions' order, and every other field", () => {
    const packed = packedManifest(MANIFEST);
    expect(Object.keys(packed.exports["."] as object)).toEqual(["types", "default"]);
    expect(packed).toMatchObject({ name: "maplace", files: ["dist"] });
  });

  it("drops the side effects only the source has: npm packs no src", () => {
    expect(packedManifest(MANIFEST).sideEffects).toEqual(["./dist/element/index.js"]);
  });
});
