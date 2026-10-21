import { globSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ROOT } from "../../../../scripts/build/package.ts";
import { captures } from "../../../../scripts/docs/markdown.ts";
import { STYLING_CLASSES } from "./reference-tables.ts";

const PACKAGE_SOURCES = globSync("packages/maplace/src/**/*.{ts,tsx}", { cwd: ROOT })
  .filter((file) => !file.includes(".test") && !file.includes("/testing/"))
  .map((file) => readFileSync(join(ROOT, file), "utf8"))
  .join("\n");

/** A class maplace puts on its markup, as its source names it: `export const X_CLASS = "maplace-…"`. */
const CLASS_CONSTANT = /export const \w+_CLASS = "(maplace-[\w-]+)"/g;

describe("the Styling page's classes", () => {
  it("are every class the package's source names, and only those", () => {
    const named = captures(PACKAGE_SOURCES, CLASS_CONSTANT);
    expect([...STYLING_CLASSES].sort()).toEqual([...new Set(named)].sort());
  });
});
