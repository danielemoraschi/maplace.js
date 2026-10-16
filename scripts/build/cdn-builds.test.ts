import { readFileSync } from "node:fs";
import { join } from "node:path";
import { build } from "esbuild";
import { beforeAll, describe, expect, it } from "vitest";
import { buildCdnScripts, CDN_SCRIPTS, LICENSES_FILE } from "./cdn-builds.ts";
import { leaveOutClustering } from "./leave-out-clustering.ts";
import { ROOT, SRC } from "./package.ts";
import { tempDir } from "./temp-dir.ts";

const outdir = tempDir("cdn");
const read = (file: string) => readFileSync(join(outdir, file), "utf8");

beforeAll(async () => {
  await buildCdnScripts(outdir);
});

describe("the CDN scripts", () => {
  it("are single files, each starting with maplace's banner", () => {
    for (const script of Object.values(CDN_SCRIPTS)) {
      const text = read(script);
      expect(text).toMatch(/^\/\*! maplace \S+ \| MIT/);
      expect(text).not.toMatch(/\bimport\(/);
    }
  });

  it("bundle the clusterer only into the cluster script", () => {
    expect(read(CDN_SCRIPTS.cluster)).toContain("clusteringbegin");
    expect(read(CDN_SCRIPTS.plain)).not.toContain("clusteringbegin");
    expect(read(CDN_SCRIPTS.plain)).toContain(CDN_SCRIPTS.cluster);
  });

  it("ship the notices of exactly the packages they bundle: the clusterer and its own", () => {
    const noticed = Array.from(read(LICENSES_FILE).matchAll(/^--- (\S+) /gm), ([, name]) => name);
    expect(noticed).toEqual([
      "@googlemaps/markerclusterer",
      "fast-equals",
      "kdbush",
      "supercluster",
    ]);
  });
});

describe("leaving clustering out", () => {
  it("fails a clustered map's load, naming the script that clusters", async () => {
    const markerLayer = join(ROOT, SRC, "google/marker-layer.ts");
    const result = await build({
      stdin: {
        contents: `export { loadMarkerLayer } from ${JSON.stringify(markerLayer)};`,
        resolveDir: ROOT,
      },
      bundle: true,
      format: "esm",
      write: false,
      plugins: [leaveOutClustering],
      logLevel: "silent",
    });
    const code = result.outputFiles[0]?.text ?? "";
    const { loadMarkerLayer } = await import(`data:text/javascript,${encodeURIComponent(code)}`);
    await expect(loadMarkerLayer(true)).rejects.toMatchObject({
      code: "provider-load-failed",
      message: expect.stringContaining(CDN_SCRIPTS.cluster),
    });
  });
});
