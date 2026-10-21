import { globSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildSync } from "esbuild";
import { describe, expect, it } from "vitest";
import { importsOf, packageName } from "../checks/imports.ts";
import { ROOT } from "./package.ts";
import { stagedBeforeTests } from "./staged-test-package.ts";

const CLUSTERER = "@googlemaps/markerclusterer";
const REACT = ["react", "react-dom"];

const { consumerDir, packageDir, manifest: stagedManifest } = stagedBeforeTests("esm");

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

describe("the npm ESM build", () => {
  it("writes every entry the packed manifest names", () => {
    const manifest = stagedManifest();
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

  it("has one MaplaceError for every entry", () => {
    const built = [...scripts(join(packageDir, "dist")).values()];
    expect(
      built.filter((text) => /\bMaplaceError = class\b|\bclass MaplaceError\b/.test(text)),
    ).toHaveLength(1);
  });

  it("bundles no dependency: it imports the clusterer, React and maplibre-gl by name", () => {
    const bare = [...scripts(join(packageDir, "dist")).values()].flatMap(bareImportsOf);
    expect(new Set(bare.map(packageName))).toEqual(new Set([CLUSTERER, ...REACT, "maplibre-gl"]));
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
