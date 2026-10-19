import { spawnSync } from "node:child_process";
import { describe, expect, it, vi } from "vitest";
import { loadedFiles, ourErrors, sourceNamedBy, typeCheckConsumer } from "./consumer-types.ts";

vi.mock("node:child_process", () => ({ spawnSync: vi.fn() }));

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

describe("typeCheckConsumer", () => {
  it("names the fixture and the project when tsc can't run, with why", () => {
    const why = new Error("spawn tsc ENOENT");
    vi.mocked(spawnSync).mockReturnValueOnce({ error: why } as ReturnType<typeof spawnSync>);
    expect(() => typeCheckConsumer("/work", "google")).toThrow(
      expect.objectContaining({
        message: "tsc couldn't type-check the google fixture in /work",
        cause: why,
      }),
    );
  });
});

describe("sourceNamedBy", () => {
  it("is the one file a fixture's config names", () => {
    expect(sourceNamedBy('{ "files": ["google.ts"] }', "google.json")).toBe("google.ts");
  });

  it("refuses a config naming no file, saying which", () => {
    expect(() => sourceNamedBy('{ "files": [] }', "google.json")).toThrow(
      "google.json names no file for tsc to check",
    );
  });
});
