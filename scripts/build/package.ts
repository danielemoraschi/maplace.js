import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Manifest } from "./packed-manifest.ts";

/** The repository root: the paths below are relative to it, as esbuild reports them. */
export const ROOT = resolve(import.meta.dirname, "../..");

export const PACKAGE_DIR = "packages/maplace";
export const SRC = `${PACKAGE_DIR}/src`;
export const DIST = `${PACKAGE_DIR}/dist`;
/** The package as npm packs it (`stage-package.ts`): what T4 checks and P2 publishes. */
export const PACKED = `${PACKAGE_DIR}/packed`;

/** The source of each published entry. */
export const PACKAGE_ENTRIES = {
  core: `${SRC}/index.ts`,
  google: `${SRC}/google/index.ts`,
  element: `${SRC}/element/index.ts`,
  elementGoogle: `${SRC}/element/google.ts`,
  react: `${SRC}/react/index.ts`,
} as const;

/** The repo's TypeScript compiler (TS 7 is a native binary, with no JS API). */
export const TSC = resolve(ROOT, "node_modules/.bin/tsc");

/** RFC §3: evergreen browsers. */
export const TARGET = "es2022";

/** A file at the repo's root, as text: README.md, CHANGELOG.md. */
export function readRootFile(name: string): string {
  return readFileSync(resolve(ROOT, name), "utf8");
}

/** The package's own manifest, as the repo has it. */
export function packageManifest(): Manifest & { readonly version: string } {
  return JSON.parse(readFileSync(resolve(ROOT, PACKAGE_DIR, "package.json"), "utf8"));
}
