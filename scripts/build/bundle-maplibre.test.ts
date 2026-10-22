import { build } from "esbuild";
import { beforeAll, describe, expect, it } from "vitest";
import { bundleMapLibre, distFile } from "./bundle-maplibre.ts";
import { ROOT } from "./package.ts";

/** A page loading maplibre-gl on demand, as the adapter does, built with the plugin once. */
let built: { readonly text: string; readonly inputs: readonly string[] };

beforeAll(async () => {
  const { outputFiles, metafile } = await build({
    stdin: { contents: 'export const load = () => import("maplibre-gl");', resolveDir: ROOT },
    absWorkingDir: ROOT,
    bundle: true,
    format: "iife",
    logLevel: "silent",
    plugins: [bundleMapLibre],
    write: false,
    metafile: true,
  });
  built = { text: outputFiles[0]?.text ?? "", inputs: Object.keys(metafile.inputs) };
});

describe("bundleMapLibre", () => {
  it("bundles maplibre-gl once, importing nothing", () => {
    const mapLibre = built.inputs.filter((input) =>
      input.endsWith("maplibre-gl/dist/maplibre-gl.mjs"),
    );
    expect(mapLibre).toHaveLength(1);
    expect(built.text).not.toMatch(/\bimport\(\s*["'`]/);
  });

  it("inlines MapLibre's worker and stylesheet into the bundle", () => {
    expect(built.text).toContain("self.worker=new");
    expect(built.text).toContain(distFile("maplibre-gl.css").slice(0, 40));
  });

  it("inlines the worker without its source map comment", () => {
    expect(built.text).not.toContain("sourceMappingURL=maplibre-gl-worker.mjs.map");
  });
});
