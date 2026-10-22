import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PREBUNDLED_DEPS } from "./prebundled-deps.ts";

const SRC = join(import.meta.dirname, "..");
const PACKAGE = join(import.meta.dirname, "../../../../packages/maplace");

/** A package a module imports: `from "react-dom"`, `import("github-buttons")`. */
const IMPORTED_PACKAGE = /(?:from |import\()"([^"./][^"]*)"/g;

/** A dependency a site module imports on demand: `import("github-buttons")`. */
const IMPORTED_ON_DEMAND = /import\("([^"./][^"]*)"\)/g;

/** Every module under `dir` whose path `matches`, but its tests and their helpers (`testing/`). */
function modulesIn(dir: string, matches: RegExp): string[] {
  return readdirSync(dir, { recursive: true, encoding: "utf8" })
    .filter((file) => matches.test(file) && !/\.test\.tsx?$|(^|\/)testing\//.test(file))
    .map((file) => readFileSync(join(dir, file), "utf8"));
}

/** The packages `modules` import, maplace's own source aside. */
function packagesImportedBy(modules: string[], imports: RegExp): string[] {
  return modules
    .flatMap((code) => [...code.matchAll(imports)].map(([, specifier = ""]) => specifier))
    .filter((specifier) => !specifier.startsWith("maplace"));
}

describe("PREBUNDLED_DEPS", () => {
  it("holds every package the site imports on demand, maplace's own source aside", () => {
    const site = modulesIn(SRC, /\.(ts|tsx|astro)$/);
    const packages = packagesImportedBy(site, IMPORTED_ON_DEMAND);
    expect(packages.filter((name) => !PREBUNDLED_DEPS.includes(name))).toEqual([]);
    expect(packages).not.toEqual([]);
  });

  it("holds every package a React version runs on, maplace's React binding's too", () => {
    const react = [
      ...modulesIn(join(PACKAGE, "examples"), /react\.tsx$/),
      ...modulesIn(join(PACKAGE, "src/react"), /\.tsx?$/),
    ];
    const packages = packagesImportedBy(react, IMPORTED_PACKAGE);
    expect(new Set(packages.filter((name) => !PREBUNDLED_DEPS.includes(name)))).toEqual(new Set());
    expect(packages).toContain("react-dom");
  });
});
