import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PREBUNDLED_DEPS } from "./prebundled-deps.ts";

const SRC = join(import.meta.dirname, "..");

/** A dependency a site module imports on demand: `import("github-buttons")`. */
const IMPORTED_ON_DEMAND = /import\("([^"./][^"]*)"\)/g;

/** Every module of the site's source, but its tests. */
function siteModules(): string[] {
  return readdirSync(SRC, { recursive: true, encoding: "utf8" })
    .filter((file) => /\.(ts|tsx|astro)$/.test(file) && !/\.test\.tsx?$/.test(file))
    .map((file) => readFileSync(join(SRC, file), "utf8"));
}

describe("PREBUNDLED_DEPS", () => {
  it("holds every package the site imports on demand, maplace's own source aside", () => {
    const imported = siteModules().flatMap((code) =>
      [...code.matchAll(IMPORTED_ON_DEMAND)].map(([, specifier = ""]) => specifier),
    );
    const packages = imported.filter((specifier) => !specifier.startsWith("maplace"));
    expect(packages.filter((name) => !PREBUNDLED_DEPS.includes(name))).toEqual([]);
    expect(packages).not.toEqual([]);
  });
});
