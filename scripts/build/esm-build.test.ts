import { existsSync, globSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildSync } from "esbuild";
import { beforeAll, describe, expect, it } from "vitest";
import { importsOf } from "../checks/imports.ts";
import { buildEsm } from "./esm-build.ts";
import type { Manifest } from "./packed-manifest.ts";
import { stagePackage } from "./stage-package.ts";
import { tempDir } from "./temp-dir.ts";

const CLUSTERER = "@googlemaps/markerclusterer";

const consumerDir = tempDir("esm");
const packageDir = join(consumerDir, "node_modules", "maplace");

/** Every `.js` file under `dir`, by path relative to it, with its text. */
function scripts(dir: string): Map<string, string> {
  const files = globSync("**/*.js", { cwd: dir });
  return new Map(files.map((file) => [file, readFileSync(join(dir, file), "utf8")]));
}

/** What a page's bundler (esbuild here, honouring `sideEffects`) keeps of `code`. */
function bundledPage(code: string): string {
  const result = buildSync({
    stdin: { contents: code, resolveDir: consumerDir },
    bundle: true,
    write: false,
    format: "esm",
    external: [CLUSTERER],
    logLevel: "silent",
  });
  return result.outputFiles[0]?.text ?? "";
}

beforeAll(() => {
  const dist = join(consumerDir, "dist");
  buildEsm(dist);
  stagePackage(packageDir, dist);
});

describe("the npm ESM build", () => {
  it("is staged with its licence and readme, as npm packs them", () => {
    for (const file of ["package.json", "LICENSE", "README.md", "CHANGELOG.md"]) {
      expect(existsSync(join(packageDir, file)), file).toBe(true);
    }
  });

  it("ships a changelog whose links reach the repo at the version's tag", () => {
    const changelog = readFileSync(join(packageDir, "CHANGELOG.md"), "utf8");
    const { version } = JSON.parse(readFileSync(join(packageDir, "package.json"), "utf8"));
    expect(changelog).toContain(
      `(https://github.com/danielemoraschi/maplace.js/blob/v${version}/docs/rfc-1.0.md)`,
    );
    expect(changelog).not.toMatch(/\]\((?!https?:|#)/);
  });

  it("writes every entry the packed manifest names", () => {
    const manifest = JSON.parse(readFileSync(join(packageDir, "package.json"), "utf8")) as Manifest;
    const entries = Object.values(manifest.exports).flatMap((target) =>
      typeof target === "string" || target.default === undefined
        ? []
        : [target.default.replace("./dist/", "")],
    );
    const built = scripts(join(packageDir, "dist"));
    expect(entries).toEqual(
      expect.arrayContaining([
        "index.js",
        "google/index.js",
        "element/index.js",
        "element/google.js",
      ]),
    );
    for (const entry of entries) expect(built.has(entry), entry).toBe(true);
  });

  it("has one MaplaceError for every entry, and bundles no dependency", () => {
    const built = [...scripts(join(packageDir, "dist")).values()];
    expect(
      built.filter((text) => /\bMaplaceError = class\b|\bclass MaplaceError\b/.test(text)),
    ).toHaveLength(1);
    const bare = built.flatMap((text) => importsOf(text).filter((path) => !path.startsWith(".")));
    expect(new Set(bare)).toEqual(new Set([CLUSTERER]));
  });

  it("keeps the elements' definition in a page's bundle, for either element entry", () => {
    expect(bundledPage('import "maplace/element";')).toContain("customElements.define");
    expect(bundledPage('import "maplace/element/google";')).toContain("customElements.define");
  });

  it("leaves nothing of the core in a page's bundle that uses none of it", () => {
    expect(bundledPage('import "maplace";').trim()).toBe("");
  });
});
