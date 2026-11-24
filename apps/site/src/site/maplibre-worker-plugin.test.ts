import type { Rollup } from "vite";
import { describe, expect, it } from "vitest";
import { mapLibreWorkerUnmapped } from "./maplibre-worker-plugin.ts";

const plugin = mapLibreWorkerUnmapped();
const generateBundle = plugin.generateBundle as (
  options: unknown,
  bundle: Rollup.OutputBundle,
) => void;
const appliesTo = plugin.applyToEnvironment as (environment: { name: string }) => boolean;

const asset = (name: string, source: string | Uint8Array) => ({
  type: "asset" as const,
  fileName: `_astro/${name}`,
  names: [name],
  originalFileNames: [],
  source,
  needsCodeReference: false,
});

const WORKER =
  "self.worker=new W;export{W as default};\n//# sourceMappingURL=maplibre-gl-worker.mjs.map\n";

describe("mapLibreWorkerUnmapped", () => {
  it("drops the source map comment from maplibre-gl's worker, as text or as bytes", () => {
    const bundle = {
      text: asset("maplibre-gl-worker.mjs", WORKER),
      bytes: asset("maplibre-gl-worker.mjs", new TextEncoder().encode(WORKER)),
    } as unknown as Rollup.OutputBundle;
    generateBundle({}, bundle);
    for (const worker of Object.values(bundle))
      expect(worker.type === "asset" && String(worker.source)).toBe(
        "self.worker=new W;export{W as default};\n",
      );
  });

  it("leaves every other file as it is", () => {
    const other = asset("site.mjs", WORKER);
    generateBundle({}, { site: other } as unknown as Rollup.OutputBundle);
    expect(other.source).toBe(WORKER);
  });

  it("acts in the client build only, where the worker is", () => {
    expect(appliesTo({ name: "client" })).toBe(true);
    expect(appliesTo({ name: "ssr" })).toBe(false);
  });
});
