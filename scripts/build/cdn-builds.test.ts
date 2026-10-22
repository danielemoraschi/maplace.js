import { readFileSync } from "node:fs";
import { join } from "node:path";
import { build, type Metafile } from "esbuild";
import { beforeAll, describe, expect, it } from "vitest";
import { bundleInMemory } from "../checks/in-memory-bundle.ts";
import {
  buildCdnScripts,
  CDN_SCRIPTS,
  type CdnScript,
  LICENSES_FILE,
  ownCodeBuildOptions,
} from "./cdn-builds.ts";
import { esmBuildOptions } from "./esm-build.ts";
import { leaveOutClustering } from "./leave-out-clustering.ts";
import { packagesLoadedBy } from "./loaded-by.ts";
import { PACKAGE_ENTRIES, ROOT, SRC } from "./package.ts";
import { tempDir } from "./temp-dir.ts";
import { bundledPackages } from "./third-party-licenses.ts";

const outdir = tempDir("cdn");
const read = (file: string) => readFileSync(join(outdir, file), "utf8");

let metafiles: Readonly<Record<CdnScript, Metafile>>;

beforeAll(async () => {
  metafiles = await buildCdnScripts(outdir);
});

describe("the CDN scripts", () => {
  it("are single files, each starting with maplace's banner", () => {
    for (const script of Object.values(CDN_SCRIPTS)) {
      const text = read(script);
      expect(text).toMatch(/^\/\*! maplace \S+ \| MIT/);
      expect(text).not.toMatch(/\bimport\(\s*["'`]/);
    }
  });

  it("link each script's source map, the MapLibre one without sources content", () => {
    const mapOf = (file: string) => JSON.parse(read(`${file}.map`));
    for (const script of Object.values(CDN_SCRIPTS)) {
      expect(read(script)).toContain(`//# sourceMappingURL=${script}.map`);
    }
    expect(mapOf(CDN_SCRIPTS.plain).sourcesContent).toBeDefined();
    expect(mapOf(CDN_SCRIPTS.maplibre).sourcesContent).toBeUndefined();
  });

  it("bundle MapLibre only into the MapLibre script, and Google's provider only into the Google ones", () => {
    expect(read(CDN_SCRIPTS.maplibre)).toContain("maplibregl-canvas");
    expect(read(CDN_SCRIPTS.maplibre)).not.toContain("importLibrary");
    for (const script of [CDN_SCRIPTS.plain, CDN_SCRIPTS.cluster]) {
      expect(read(script)).toContain("importLibrary");
      expect(read(script)).not.toContain("maplibregl-canvas");
    }
  });

  it("bundle into the MapLibre script every package its npm entry loads, clustering's included", async () => {
    const { metafile } = await bundleInMemory(esmBuildOptions());
    const bundled = bundledPackages([metafiles.maplibre]).map((dir) =>
      dir.split("node_modules/").at(-1),
    );
    const loaded = [...packagesLoadedBy(metafile, PACKAGE_ENTRIES.elementMapLibre)];
    expect(bundled).toEqual(expect.arrayContaining(loaded));
  });

  it("measure maplace's own code in the MapLibre script without maplibre-gl", async () => {
    const { metafile } = await bundleInMemory(ownCodeBuildOptions("maplibre"));
    expect(Object.keys(metafile.inputs).some((input) => input.includes("maplibre-gl"))).toBe(false);
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
      "maplibre-gl",
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
