import { describe, expect, it } from "vitest";
import { loadedFiles, ourErrors } from "./consumer-types.ts";

const OUTPUT = [
  "/work/node_modules/@types/google.maps/index.d.ts",
  "/work/node_modules/maplace/dist/index.d.ts",
  "node_modules/@types/google.maps/index.d.ts(10,3): error TS2412: Type 'undefined' is not …",
  "node_modules/@googlemaps/markerclusterer/dist/index.d.ts(1,1): error TS1234: Other's.",
  "../../../@types/google.maps/index.d.ts(13528,16): error TS2420: Installed up the tree.",
  "node_modules/maplace/dist/google/options.d.ts(21,5): error TS2503: Cannot find namespace 'google'.",
  "  Continuation of the error above.",
  "node_modules/maplace-x/index.d.ts(1,1): error TS1: A package named like ours.",
  "core-and-element.ts(3,10): error TS2305: Module 'maplace' has no exported member 'x'.",
  "error TS6053: File 'missing.ts' not found.",
].join("\n");

describe("ourErrors", () => {
  it("keeps errors in maplace's declarations, the fixture and the project, not other packages'", () => {
    expect(ourErrors(OUTPUT)).toEqual([
      "node_modules/maplace/dist/google/options.d.ts(21,5): error TS2503: Cannot find namespace 'google'.",
      "core-and-element.ts(3,10): error TS2305: Module 'maplace' has no exported member 'x'.",
      "error TS6053: File 'missing.ts' not found.",
    ]);
  });
});

describe("loadedFiles", () => {
  it("lists the files tsc loaded, without its errors", () => {
    expect(loadedFiles(OUTPUT)).toEqual([
      "/work/node_modules/@types/google.maps/index.d.ts",
      "/work/node_modules/maplace/dist/index.d.ts",
    ]);
  });
});
