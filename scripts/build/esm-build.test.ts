import { existsSync, globSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildSync } from "esbuild";
import { beforeAll, describe, expect, it } from "vitest";
import { importsOf, packageName } from "../checks/imports.ts";
import { relativeLinksIn } from "../checks/markdown.ts";
import { CDN_SCRIPTS } from "./cdn-builds.ts";
import { buildEsm } from "./esm-build.ts";
import { ROOT } from "./package.ts";
import type { Manifest } from "./packed-manifest.ts";
import { stagePackage } from "./stage-package.ts";
import { integrityOfFile } from "./subresource-integrity.ts";
import { tempDir } from "./temp-dir.ts";

const CLUSTERER = "@googlemaps/markerclusterer";
const REACT = ["react", "react-dom"];

const consumerDir = tempDir("esm");
const packageDir = join(consumerDir, "node_modules", "maplace");

/** Every `.js` file under `dir`, by path relative to it, with its text. */
function scripts(dir: string): Map<string, string> {
  const files = globSync("**/*.js", { cwd: dir });
  return new Map(files.map((file) => [file, readFileSync(join(dir, file), "utf8")]));
}

function bareImportsOf(text: string): string[] {
  return importsOf(text).filter((path) => !path.startsWith("."));
}

/**
 * What a page's bundler (esbuild here, honouring `sideEffects`) keeps of `code`: against the
 * built package, or against its source as the repo's own tools (the site) resolve it.
 */
function bundledPage(code: string, { fromSource = false } = {}): string {
  const result = buildSync({
    stdin: { contents: code, resolveDir: fromSource ? ROOT : consumerDir },
    conditions: fromSource ? ["maplace:source"] : [],
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
  // Staging pins the README to the CDN scripts' bytes, whatever they are (cdn-builds.test.ts builds them).
  for (const file of Object.values(CDN_SCRIPTS)) writeFileSync(join(dist, file), `/* ${file} */`);
  stagePackage(packageDir, dist);
});

/** The packed manifest, as staged. */
function staged(): Manifest & { readonly version: string } {
  return JSON.parse(readFileSync(join(packageDir, "package.json"), "utf8"));
}

describe("the npm ESM build", () => {
  it("is staged with its licence and readme, as npm packs them", () => {
    for (const file of ["package.json", "LICENSE", "README.md", "CHANGELOG.md"]) {
      expect(existsSync(join(packageDir, file)), file).toBe(true);
    }
  });

  it("ships a README pinning each CDN script to its version and its integrity", () => {
    const readme = readFileSync(join(packageDir, "README.md"), "utf8");
    for (const file of Object.values(CDN_SCRIPTS)) {
      const integrity = integrityOfFile(join(packageDir, "dist", file));
      expect(readme).toContain(
        `maplace@${staged().version}/dist/${file}"\n  integrity="${integrity}"`,
      );
    }
    expect(readme).not.toContain("x.y.z");
    expect(relativeLinksIn(readme)).toEqual([]);
  });

  it("ships a changelog whose links reach the repo at the version's tag", () => {
    const changelog = readFileSync(join(packageDir, "CHANGELOG.md"), "utf8");
    const { version } = staged();
    expect(changelog).toContain(
      `(https://github.com/danielemoraschi/maplace.js/blob/v${version}/docs/rfc-1.0.md)`,
    );
    expect(relativeLinksIn(changelog)).toEqual([]);
  });

  it("writes every entry the packed manifest names", () => {
    const manifest = staged();
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
        "react/index.js",
      ]),
    );
    for (const entry of entries) expect(built.has(entry), entry).toBe(true);
  });

  it("has one MaplaceError for every entry, and bundles no dependency", () => {
    const built = [...scripts(join(packageDir, "dist")).values()];
    expect(
      built.filter((text) => /\bMaplaceError = class\b|\bclass MaplaceError\b/.test(text)),
    ).toHaveLength(1);
    const bare = built.flatMap(bareImportsOf);
    expect(new Set(bare.map(packageName))).toEqual(new Set([CLUSTERER, ...REACT]));
  });

  it("leaves React to the React entry alone, so no other entry needs it", () => {
    const usingReact = [...scripts(join(packageDir, "dist"))].filter(([, text]) =>
      bareImportsOf(text).some((path) => REACT.includes(packageName(path))),
    );
    expect(usingReact.map(([file]) => file)).toEqual(["react/index.js"]);
  });

  it('opens the React entry, and only it, with "use client", for server components', () => {
    const clientEntries = [...scripts(join(packageDir, "dist"))].filter(([, text]) =>
      /^"use client";/.test(text),
    );
    expect(clientEntries.map(([file]) => file)).toEqual(["react/index.js"]);
  });

  it("keeps the elements' definition in a page's bundle, for either element entry", () => {
    expect(bundledPage('import "maplace/element";')).toContain("customElements.define");
    expect(bundledPage('import "maplace/element/google";')).toContain("customElements.define");
  });

  it("keeps them from the source too, for the repo's own pages", () => {
    const fromSource = { fromSource: true };
    expect(bundledPage('import "maplace/element";', fromSource)).toContain("customElements.define");
    expect(bundledPage('import "maplace/element/google";', fromSource)).toContain(
      "customElements.define",
    );
  });

  it("leaves nothing of the core in a page's bundle that uses none of it", () => {
    expect(bundledPage('import "maplace";').trim()).toBe("");
  });
});
