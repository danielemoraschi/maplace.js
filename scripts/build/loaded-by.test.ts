import type { Metafile } from "esbuild";
import { describe, expect, it } from "vitest";
import type { OutputImport } from "../checks/in-memory-bundle.ts";
import { outputsLoadedBy, packagesLoadedBy } from "./loaded-by.ts";

const statically = (path: string, external = false): OutputImport => ({
  path,
  kind: "import-statement",
  external,
});
const onDemand = (path: string, external = false): OutputImport => ({
  path,
  kind: "dynamic-import",
  external,
});

/** A metafile of these outputs, each with its entry point (if any) and its imports. */
function metafileOf(
  outputs: Record<string, { entryPoint?: string; imports: OutputImport[] }>,
): Metafile {
  const entries = Object.entries(outputs).map(([path, { entryPoint, imports }]) => [
    path,
    { bytes: 0, inputs: {}, exports: [], imports, ...(entryPoint ? { entryPoint } : {}) },
  ]);
  return { inputs: {}, outputs: Object.fromEntries(entries) };
}

const METAFILE = metafileOf({
  "a.js": { entryPoint: "src/a.ts", imports: [statically("shared.js"), onDemand("lazy.js")] },
  "b.js": { entryPoint: "src/b.ts", imports: [statically("shared.js"), statically("b-only.js")] },
  "shared.js": { imports: [statically("react", true)] },
  "lazy.js": { imports: [onDemand("maplibre-gl", true), statically("maplibre-gl/x", true)] },
  "b-only.js": { imports: [statically("@scope/pkg/sub", true)] },
});

describe("outputsLoadedBy", () => {
  it("follows dynamic imports as well as static ones", () => {
    expect(outputsLoadedBy(METAFILE, "src/a.ts")).toEqual(
      new Set(["a.js", "shared.js", "lazy.js"]),
    );
  });

  it("stops at outputs other entries alone load", () => {
    expect(outputsLoadedBy(METAFILE, "src/b.ts")).toEqual(
      new Set(["b.js", "shared.js", "b-only.js"]),
    );
  });

  it("throws for an entry the build has no output for", () => {
    expect(() => outputsLoadedBy(METAFILE, "src/c.ts")).toThrow("no output for entry src/c.ts");
  });
});

describe("packagesLoadedBy", () => {
  it("names the packages those outputs import, once each", () => {
    expect(packagesLoadedBy(METAFILE, "src/a.ts")).toEqual(new Set(["react", "maplibre-gl"]));
    expect(packagesLoadedBy(METAFILE, "src/b.ts")).toEqual(new Set(["react", "@scope/pkg"]));
  });
});
